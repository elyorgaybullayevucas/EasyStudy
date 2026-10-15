package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.*;
import uz.easystudy.dto.ExamDtos.*;
import uz.easystudy.repository.*;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository exams;
    private final SectionRepository sections;
    private final QuestionRepository questions;
    private final BandConversionRepository bands;
    private final AttemptRepository attempts;
    private final CategoryService categoryService;
    private final uz.easystudy.media.MediaService media;

    // ---------------- talaba ----------------

    @Transactional(readOnly = true)
    public List<ExamSummary> listPublished(String categorySlug, Boolean featured) {
        List<Exam> list = (categorySlug == null || categorySlug.isBlank())
                ? exams.findByPublishedTrueOrderByFeaturedDescTitleAsc()
                : exams.findPublishedByCategory(categorySlug);
        if (Boolean.TRUE.equals(featured)) list = list.stream().filter(Exam::isFeatured).toList();
        return summaries(list);
    }

    @Transactional(readOnly = true)
    public List<ExamSummary> adminList() {
        return summaries(exams.findAllByOrderByCreatedAtDesc());
    }

    private List<ExamSummary> summaries(List<Exam> list) {
        Map<Long, Long> counts = new HashMap<>();
        if (!list.isEmpty()) {
            for (Object[] r : attempts.attemptCounts(list.stream().map(Exam::getId).toList())) counts.put((Long) r[0], ((Number) r[1]).longValue());
        }
        return list.stream().map(e -> new ExamSummary(
                e.getId(), e.getCode(), e.getTitle(), e.getDescription(), e.getLevel(), e.isFeatured(), e.isPublished(),
                CategoryService.brief(e.getCategory()),
                e.getSections().stream().mapToInt(Section::getDurationMinutes).sum(),
                e.getSections().stream().mapToInt(s -> s.getQuestions().size()).sum(),
                counts.getOrDefault(e.getId(), 0L))).toList();
    }

    /** Student ko'rinishi: answer_key hech qachon DTO ga tushmaydi. */
    @Transactional(readOnly = true)
    public ExamDetail getPublished(Long id) {
        Exam e = exams.findByIdAndPublishedTrue(id).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        return new ExamDetail(e.getId(), e.getCode(), e.getTitle(), e.getDescription(), e.getLevel(), e.isFeatured(),
                CategoryService.brief(e.getCategory()),
                e.getSections().stream().map(s -> new SectionView(
                        s.getId(), s.getTitle(), s.getOrderIndex(), s.getDurationMinutes(), media.url(s.getAudioKey()),
                        s.getQuestions().stream().map(q -> new QuestionView(
                                q.getId(), q.getOrderIndex(), q.getType(), q.getPrompt(), q.getPassage(),
                                q.getOptions(), q.getPoints())).toList())).toList());
    }

    // ---------------- admin ----------------

    private Exam require(Long id) {
        return exams.findById(id).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
    }

    @Transactional(readOnly = true)
    public ExamAdminDetail adminDetail(Long id) {
        return toAdmin(require(id));
    }

    @SuppressWarnings("unchecked")
    private ExamAdminDetail toAdmin(Exam e) {
        List<SectionAdminView> secs = e.getSections().stream().map(s -> new SectionAdminView(
                s.getId(), s.getTitle(), s.getOrderIndex(), s.getDurationMinutes(), s.getAudioKey(), media.url(s.getAudioKey()),
                s.getQuestions().stream().map(q -> {
                    Object acc = q.getAnswerKey() == null ? null : q.getAnswerKey().get("accepted");
                    List<String> accepted = acc instanceof List<?> l ? l.stream().map(String::valueOf).toList() : List.of();
                    return new QuestionAdminView(q.getId(), q.getOrderIndex(), q.getType(), q.getPrompt(), q.getPassage(),
                            q.getOptions(), accepted, q.getPoints());
                }).toList())).toList();
        List<BandRow> rows = bands.findByExamIdOrderByMinRawAsc(e.getId()).stream()
                .map(b -> new BandRow(b.getMinRaw(), b.getMaxRaw(), b.getScaled())).toList();
        return new ExamAdminDetail(e.getId(), e.getCode(), e.getTitle(), e.getDescription(), e.getLevel(), e.isFeatured(),
                e.isPublished(), CategoryService.brief(e.getCategory()), secs, rows);
    }

    @Transactional
    public ExamAdminDetail createExam(ExamInput in) {
        String code = in.code().trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]+", "_");
        if (exams.existsByCode(code)) throw AppException.conflict("Bu kod band");
        Exam e = new Exam();
        e.setCode(code);
        apply(e, in);
        exams.save(e);
        return toAdmin(e);
    }

    @Transactional
    public ExamAdminDetail updateExam(Long id, ExamInput in) {
        Exam e = require(id);
        String code = in.code().trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]+", "_");
        if (!code.equals(e.getCode()) && exams.existsByCode(code)) throw AppException.conflict("Bu kod band");
        e.setCode(code);
        apply(e, in);
        return toAdmin(e);
    }

    private void apply(Exam e, ExamInput in) {
        e.setTitle(in.title().trim());
        e.setDescription(in.description());
        e.setLevel(in.level() == null ? CourseLevel.INTERMEDIATE : in.level());
        e.setFeatured(in.featured());
        e.setPublished(in.published());
        e.setCategory(categoryService.require(in.categoryId()));
    }

    @Transactional
    public void deleteExam(Long id) {
        exams.delete(require(id));
    }

    @Transactional
    public void setPublished(Long examId, boolean published) {
        require(examId).setPublished(published);
    }

    @Transactional
    public Long addSection(Long examId, SectionInput r) {
        Exam e = require(examId);
        Section s = new Section();
        s.setExam(e);
        s.setTitle(r.title());
        s.setOrderIndex(r.orderIndex());
        s.setDurationMinutes(r.durationMinutes());
        s.setAudioKey(r.audioKey());
        e.getSections().add(s);
        return sections.save(s).getId();
    }

    @Transactional
    public void updateSection(Long sectionId, SectionInput r) {
        Section s = sections.findById(sectionId).orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        s.setTitle(r.title());
        s.setOrderIndex(r.orderIndex());
        s.setDurationMinutes(r.durationMinutes());
        s.setAudioKey(r.audioKey() == null || r.audioKey().isBlank() ? null : r.audioKey());
    }

    @Transactional
    public void deleteSection(Long sectionId) {
        Section s = sections.findById(sectionId).orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        s.getExam().getSections().remove(s);
        sections.delete(s);
    }

    @Transactional
    public Long addQuestion(Long sectionId, QuestionInput r) {
        Section s = sections.findById(sectionId).orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        Question q = new Question();
        q.setSection(s);
        applyQuestion(q, r);
        s.getQuestions().add(q);
        return questions.save(q).getId();
    }

    @Transactional
    public void updateQuestion(Long questionId, QuestionInput r) {
        Question q = questions.findById(questionId).orElseThrow(() -> AppException.notFound("Savol topilmadi"));
        applyQuestion(q, r);
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        Question q = questions.findById(questionId).orElseThrow(() -> AppException.notFound("Savol topilmadi"));
        q.getSection().getQuestions().remove(q);
        questions.delete(q);
    }

    private void applyQuestion(Question q, QuestionInput r) {
        if (r.type() != QuestionType.ESSAY && (r.accepted() == null || r.accepted().isEmpty())) {
            throw AppException.badRequest("To'g'ri javob ko'rsatilishi kerak");
        }
        q.setOrderIndex(r.orderIndex());
        q.setType(r.type());
        q.setPrompt(r.prompt());
        q.setPassage(r.passage());
        q.setOptions(r.options());
        q.setAnswerKey(Map.<String, Object>of("accepted", r.accepted() == null ? List.of() : r.accepted()));
        q.setPoints(r.points());
    }

    @Transactional
    public void setBands(Long examId, List<BandRow> rows) {
        Exam e = require(examId);
        bands.deleteByExamId(e.getId());
        for (BandRow r : rows) {
            BandConversion b = new BandConversion();
            b.setExamId(e.getId());
            b.setMinRaw(r.minRaw());
            b.setMaxRaw(r.maxRaw());
            b.setScaled(r.scaled());
            bands.save(b);
        }
    }
}

package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.*;
import uz.easystudy.dto.ExamDtos.*;
import uz.easystudy.media.MediaService;
import uz.easystudy.repository.*;
import uz.easystudy.security.AuthPrincipal;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository exams;
    private final SectionRepository sections;
    private final QuestionRepository questions;
    private final BandConversionRepository bands;
    private final AttemptRepository attempts;
    private final UserRepository users;
    private final CategoryService categoryService;
    private final MediaService media;

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
    public List<ExamSummary> adminList(AuthPrincipal me) {
        return summaries(me.role() == Role.ADMIN ? exams.findAllByOrderByCreatedAtDesc() : exams.findByOwnerIdOrderByCreatedAtDesc(me.id()));
    }

    private List<ExamSummary> summaries(List<Exam> list) {
        Map<Long, Long> counts = new HashMap<>();
        if (!list.isEmpty()) {
            for (Object[] r : attempts.attemptCounts(list.stream().map(Exam::getId).toList())) counts.put((Long) r[0], ((Number) r[1]).longValue());
        }
        return list.stream().map(e -> new ExamSummary(
                e.getId(), e.getCode(), e.getTitle(), e.getDescription(), e.getLevel(), e.isFeatured(), e.isPublished(),
                CategoryService.brief(e.getCategory()), e.getTemplateCode(), e.getScoringMode(), e.getNavigationMode(),
                e.getSections().stream().map(Section::getTitle).toList(),
                e.getSections().stream().mapToInt(Section::getDurationMinutes).sum(),
                e.getSections().stream().mapToInt(s -> s.getQuestions().size()).sum(),
                counts.getOrDefault(e.getId(), 0L))).toList();
    }

    public static boolean isManual(Section s) {
        return !s.getQuestions().isEmpty() && s.getQuestions().stream().allMatch(q -> q.getType().isManual());
    }

    /** Student ko'rinishi: answer_key hech qachon DTO ga tushmaydi. */
    @Transactional(readOnly = true)
    public ExamDetail getPublished(Long id) {
        Exam e = exams.findByIdAndPublishedTrue(id).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        return toDetail(e);
    }

    public ExamDetail toDetail(Exam e) {
        return new ExamDetail(e.getId(), e.getCode(), e.getTitle(), e.getDescription(), e.getLevel(), e.isFeatured(),
                CategoryService.brief(e.getCategory()), e.getTemplateCode(), e.getScoringMode(), e.getNavigationMode(), e.getInstructions(),
                e.getSections().stream().map(s -> new SectionView(
                        s.getId(), s.getTitle(), s.getPartType(), s.getOrderIndex(), s.getDurationMinutes(), s.getInstructions(),
                        media.url(s.getAudioKey()), isManual(s),
                        s.getQuestions().stream().map(q -> new QuestionView(
                                q.getId(), q.getOrderIndex(), q.getType(), q.getPrompt(), q.getPassage(),
                                q.getOptions(), q.getPoints(), media.url(q.getImageKey()),
                                q.getMinWords(), q.getPrepSeconds(), q.getAnswerSeconds())).toList())).toList());
    }

    // ---------------- admin ----------------

    public boolean canManage(AuthPrincipal me, Exam e) {
        if (me == null) return false;
        if (me.role() == Role.ADMIN) return true;
        return me.role() == Role.TEACHER && e.getOwner() != null && e.getOwner().getId().equals(me.id());
    }

    public Exam managed(Long id, AuthPrincipal me) {
        Exam e = exams.findById(id).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        if (!canManage(me, e)) throw AppException.forbidden("Bu imtihonni boshqarishga ruxsat yo'q");
        return e;
    }

    private Section managedSection(Long sectionId, AuthPrincipal me) {
        Section s = sections.findById(sectionId).orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        managed(s.getExam().getId(), me);
        return s;
    }

    private Question managedQuestion(Long questionId, AuthPrincipal me) {
        Question q = questions.findById(questionId).orElseThrow(() -> AppException.notFound("Savol topilmadi"));
        managed(q.getSection().getExam().getId(), me);
        return q;
    }

    @Transactional(readOnly = true)
    public ExamAdminDetail adminDetail(Long id, AuthPrincipal me) {
        return toAdmin(managed(id, me));
    }

    private static BandRow row(BandConversion b) {
        return new BandRow(b.getMinRaw(), b.getMaxRaw(), b.getScaled(), b.getLabel());
    }

    private ExamAdminDetail toAdmin(Exam e) {
        List<BandConversion> all = bands.findByExamIdOrderBySectionIdAscMinRawAsc(e.getId());
        Map<Long, List<BandRow>> bySection = new HashMap<>();
        List<BandRow> overall = new ArrayList<>();
        for (BandConversion b : all) {
            if (b.getSectionId() == null) overall.add(row(b));
            else bySection.computeIfAbsent(b.getSectionId(), k -> new ArrayList<>()).add(row(b));
        }
        List<SectionAdminView> secs = e.getSections().stream().map(s -> new SectionAdminView(
                s.getId(), s.getTitle(), s.getPartType(), s.getOrderIndex(), s.getDurationMinutes(), s.getInstructions(),
                s.getDefaultPoints(), s.getAudioKey(), media.url(s.getAudioKey()),
                bySection.getOrDefault(s.getId(), List.of()),
                s.getQuestions().stream().map(this::toAdminQuestion).toList())).toList();
        return new ExamAdminDetail(e.getId(), e.getCode(), e.getTitle(), e.getDescription(), e.getLevel(), e.isFeatured(),
                e.isPublished(), CategoryService.brief(e.getCategory()),
                e.getOwner() == null ? null : e.getOwner().getId(), e.getOwner() == null ? null : e.getOwner().getFullName(),
                e.getTemplateCode(), e.getScoringMode(), e.getNavigationMode(), e.getInstructions(), secs, overall);
    }

    private QuestionAdminView toAdminQuestion(Question q) {
        Object acc = q.getAnswerKey() == null ? null : q.getAnswerKey().get("accepted");
        List<String> accepted = acc instanceof List<?> l ? l.stream().map(String::valueOf).toList() : List.of();
        return new QuestionAdminView(q.getId(), q.getOrderIndex(), q.getType(), q.getPrompt(), q.getPassage(),
                q.getOptions(), accepted, q.getPoints(), q.getWeight(), q.getImageKey(), media.url(q.getImageKey()),
                q.getMinWords(), q.getPrepSeconds(), q.getAnswerSeconds());
    }

    private String normaliseCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]+", "_");
    }

    @Transactional
    public ExamAdminDetail createExam(ExamInput in, AuthPrincipal me) {
        String code = normaliseCode(in.code());
        if (exams.existsByCode(code)) throw AppException.conflict("Bu kod band");
        Exam e = new Exam();
        e.setCode(code);
        e.setOwner(users.getReferenceById(me.id()));
        e.setTemplateCode("CUSTOM");
        apply(e, in);
        exams.save(e);
        return toAdmin(e);
    }

    /** Shablondan: bo'limlar, konversiya jadvallari va Writing/Speaking vazifalari tayyor. */
    @Transactional
    public ExamAdminDetail createFromTemplate(String templateCode, ExamInput in, AuthPrincipal me) {
        ExamTemplates.Template t = ExamTemplates.find(templateCode).orElseThrow(() -> AppException.notFound("Shablon topilmadi"));
        String code = normaliseCode(in.code());
        if (exams.existsByCode(code)) throw AppException.conflict("Bu kod band");
        Exam e = new Exam();
        e.setCode(code);
        e.setOwner(users.getReferenceById(me.id()));
        e.setTemplateCode(t.info().code());
        apply(e, in);
        e.setScoringMode(t.info().scoringMode());
        e.setNavigationMode(t.info().navigationMode());
        if (e.getInstructions() == null || e.getInstructions().isBlank()) e.setInstructions(t.info().description());
        exams.save(e);

        int idx = 0;
        for (TemplateSection ts : t.info().sections()) {
            Section s = new Section();
            s.setExam(e);
            s.setTitle(ts.title());
            s.setPartType(ts.partType());
            s.setOrderIndex(idx + 1);
            s.setDurationMinutes(ts.durationMinutes());
            s.setDefaultPoints(ts.defaultPoints());
            s.setInstructions(ts.instructions());
            e.getSections().add(s);
            sections.save(s);

            int qIdx = 1;
            for (ExamTemplates.SeedQuestion sq : t.seedQuestions().getOrDefault(idx, List.of())) {
                Question q = new Question();
                q.setSection(s);
                q.setOrderIndex(qIdx++);
                q.setType(QuestionType.valueOf(sq.type()));
                q.setPrompt(sq.prompt());
                q.setPoints(sq.points());
                q.setWeight(sq.weight());
                q.setMinWords(sq.minWords());
                q.setPrepSeconds(sq.prepSeconds());
                q.setAnswerSeconds(sq.answerSeconds());
                q.setAnswerKey(Map.<String, Object>of("accepted", List.of()));
                s.getQuestions().add(q);
                questions.save(q);
            }
            for (BandRow r : t.sectionBands().getOrDefault(idx, List.of())) saveBand(e.getId(), s.getId(), r);
            idx++;
        }
        for (BandRow r : t.overallBands()) saveBand(e.getId(), null, r);
        return toAdmin(e);
    }

    private void saveBand(Long examId, Long sectionId, BandRow r) {
        BandConversion b = new BandConversion();
        b.setExamId(examId);
        b.setSectionId(sectionId);
        b.setMinRaw(r.minRaw());
        b.setMaxRaw(r.maxRaw());
        b.setScaled(r.scaled());
        b.setLabel(r.label());
        bands.save(b);
    }

    @Transactional
    public ExamAdminDetail updateExam(Long id, ExamInput in, AuthPrincipal me) {
        Exam e = managed(id, me);
        String code = normaliseCode(in.code());
        if (!code.equals(e.getCode()) && exams.existsByCode(code)) throw AppException.conflict("Bu kod band");
        e.setCode(code);
        if (in.published() && !e.isPublished()) validateForPublish(e);
        apply(e, in);
        return toAdmin(e);
    }

    /** Nashr qilishdan oldin: kamida bitta bo'lim va har bo'limda savol bo'lsin. */
    private void validateForPublish(Exam e) {
        if (e.getSections().isEmpty()) throw AppException.badRequest("Nashr qilish uchun kamida bitta bo'lim kerak");
        for (Section s : e.getSections()) {
            if (s.getQuestions().isEmpty()) throw AppException.badRequest("\"" + s.getTitle() + "\" bo'limida savol yo'q");
            if (s.getPartType() == PartType.LISTENING && (s.getAudioKey() == null || s.getAudioKey().isBlank()))
                throw AppException.badRequest("\"" + s.getTitle() + "\" bo'limiga audio yuklanmagan");
        }
    }

    private void apply(Exam e, ExamInput in) {
        e.setTitle(in.title().trim());
        e.setDescription(in.description());
        e.setLevel(in.level() == null ? CourseLevel.INTERMEDIATE : in.level());
        e.setFeatured(in.featured());
        e.setPublished(in.published());
        e.setCategory(categoryService.require(in.categoryId()));
        if (in.scoringMode() != null) e.setScoringMode(in.scoringMode());
        if (in.navigationMode() != null) e.setNavigationMode(in.navigationMode());
        e.setInstructions(in.instructions());
    }

    @Transactional
    public void deleteExam(Long id, AuthPrincipal me) {
        exams.delete(managed(id, me));
    }

    @Transactional
    public void setPublished(Long examId, boolean published, AuthPrincipal me) {
        Exam e = managed(examId, me);
        if (published && !e.isPublished()) validateForPublish(e);
        e.setPublished(published);
    }

    // ---------------- bo'limlar ----------------

    @Transactional
    public Long addSection(Long examId, SectionInput r, AuthPrincipal me) {
        Exam e = managed(examId, me);
        Section s = new Section();
        s.setExam(e);
        applySection(s, r);
        e.getSections().add(s);
        return sections.save(s).getId();
    }

    @Transactional
    public void updateSection(Long sectionId, SectionInput r, AuthPrincipal me) {
        Section s = managedSection(sectionId, me);
        String old = s.getAudioKey();
        applySection(s, r);
        if (old != null && !old.equals(s.getAudioKey())) media.delete(old);
    }

    private void applySection(Section s, SectionInput r) {
        s.setTitle(r.title().trim());
        s.setPartType(r.partType() == null ? PartType.GENERAL : r.partType());
        s.setOrderIndex(r.orderIndex());
        s.setDurationMinutes(r.durationMinutes());
        s.setInstructions(r.instructions());
        if (r.defaultPoints() != null) s.setDefaultPoints(r.defaultPoints());
        s.setAudioKey(r.audioKey() == null || r.audioKey().isBlank() ? null : r.audioKey());
    }

    @Transactional
    public void deleteSection(Long sectionId, AuthPrincipal me) {
        Section s = managedSection(sectionId, me);
        s.getExam().getSections().remove(s);
        media.delete(s.getAudioKey());
        sections.delete(s);
    }

    @Transactional
    public void setSectionBands(Long sectionId, List<BandRow> rows, AuthPrincipal me) {
        Section s = managedSection(sectionId, me);
        bands.deleteForSection(s.getExam().getId(), s.getId());
        for (BandRow r : rows) saveBand(s.getExam().getId(), s.getId(), r);
    }

    @Transactional
    public void setOverallBands(Long examId, List<BandRow> rows, AuthPrincipal me) {
        Exam e = managed(examId, me);
        bands.deleteOverall(e.getId());
        for (BandRow r : rows) saveBand(e.getId(), null, r);
    }

    // ---------------- savollar ----------------

    @Transactional
    public Long addQuestion(Long sectionId, QuestionInput r, AuthPrincipal me) {
        Section s = managedSection(sectionId, me);
        Question q = new Question();
        q.setSection(s);
        applyQuestion(q, r);
        s.getQuestions().add(q);
        return questions.save(q).getId();
    }

    @Transactional
    public void updateQuestion(Long questionId, QuestionInput r, AuthPrincipal me) {
        Question q = managedQuestion(questionId, me);
        String old = q.getImageKey();
        applyQuestion(q, r);
        if (old != null && !old.equals(q.getImageKey())) media.delete(old);
    }

    @Transactional
    public void deleteQuestion(Long questionId, AuthPrincipal me) {
        Question q = managedQuestion(questionId, me);
        q.getSection().getQuestions().remove(q);
        media.delete(q.getImageKey());
        questions.delete(q);
    }

    private void applyQuestion(Question q, QuestionInput r) {
        if (!r.type().isManual() && (r.accepted() == null || r.accepted().isEmpty())) {
            throw AppException.badRequest("To'g'ri javob ko'rsatilishi kerak");
        }
        q.setOrderIndex(r.orderIndex());
        q.setType(r.type());
        q.setPrompt(r.prompt());
        q.setPassage(r.passage());
        q.setOptions(r.options());
        q.setAnswerKey(Map.<String, Object>of("accepted", r.accepted() == null ? List.of() : r.accepted()));
        q.setPoints(r.points());
        q.setWeight(r.weight() == null ? BigDecimal.ONE : r.weight());
        q.setImageKey(r.imageKey() == null || r.imageKey().isBlank() ? null : r.imageKey());
        q.setMinWords(r.minWords());
        q.setPrepSeconds(r.prepSeconds());
        q.setAnswerSeconds(r.answerSeconds());
    }
}

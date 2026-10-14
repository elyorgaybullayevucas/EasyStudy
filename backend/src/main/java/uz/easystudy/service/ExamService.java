package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.Exam;
import uz.easystudy.domain.Question;
import uz.easystudy.domain.Section;
import uz.easystudy.dto.ExamDtos.*;
import uz.easystudy.repository.ExamRepository;
import uz.easystudy.repository.QuestionRepository;
import uz.easystudy.repository.SectionRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository exams;
    private final SectionRepository sections;
    private final QuestionRepository questions;

    @Transactional(readOnly = true)
    public List<ExamSummary> listPublished() {
        return exams.findByPublishedTrueOrderByTitleAsc().stream().map(e -> new ExamSummary(
                e.getId(), e.getCode(), e.getTitle(), e.getDescription(),
                e.getSections().stream().mapToInt(Section::getDurationMinutes).sum(),
                e.getSections().stream().mapToInt(s -> s.getQuestions().size()).sum())).toList();
    }

    /** Student ko'rinishi: answer_key hech qachon DTO ga tushmaydi. */
    @Transactional(readOnly = true)
    public ExamDetail getPublished(Long id) {
        Exam e = exams.findByIdAndPublishedTrue(id).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        return toDetail(e);
    }

    static ExamDetail toDetail(Exam e) {
        return new ExamDetail(e.getId(), e.getCode(), e.getTitle(), e.getDescription(),
                e.getSections().stream().map(s -> new SectionView(
                        s.getId(), s.getTitle(), s.getOrderIndex(), s.getDurationMinutes(),
                        s.getQuestions().stream().map(q -> new QuestionView(
                                q.getId(), q.getOrderIndex(), q.getType(), q.getPrompt(), q.getPassage(),
                                q.getOptions(), q.getPoints())).toList())).toList());
    }

    // ---------------- admin ----------------

    @Transactional
    public ExamSummary createExam(CreateExamRequest r) {
        if (exams.existsByCode(r.code())) throw AppException.conflict("Bu kod band");
        Exam e = new Exam();
        e.setCode(r.code().toUpperCase());
        e.setTitle(r.title());
        e.setDescription(r.description());
        e.setPublished(r.published());
        exams.save(e);
        return new ExamSummary(e.getId(), e.getCode(), e.getTitle(), e.getDescription(), 0, 0);
    }

    @Transactional
    public Long addSection(Long examId, CreateSectionRequest r) {
        Exam e = exams.findById(examId).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        Section s = new Section();
        s.setExam(e);
        s.setTitle(r.title());
        s.setOrderIndex(r.orderIndex());
        s.setDurationMinutes(r.durationMinutes());
        s.setAudioKey(r.audioKey());
        return sections.save(s).getId();
    }

    @Transactional
    public Long addQuestion(Long sectionId, CreateQuestionRequest r) {
        Section s = sections.findById(sectionId).orElseThrow(() -> AppException.notFound("Bo'lim topilmadi"));
        Question q = new Question();
        q.setSection(s);
        q.setOrderIndex(r.orderIndex());
        q.setType(r.type());
        q.setPrompt(r.prompt());
        q.setPassage(r.passage());
        q.setOptions(r.options());
        q.setAnswerKey(Map.<String, Object>of("accepted", r.accepted()));
        q.setPoints(r.points());
        return questions.save(q).getId();
    }

    @Transactional
    public void setPublished(Long examId, boolean published) {
        Exam e = exams.findById(examId).orElseThrow(() -> AppException.notFound("Imtihon topilmadi"));
        e.setPublished(published);
    }
}

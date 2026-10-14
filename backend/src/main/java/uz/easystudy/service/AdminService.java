package uz.easystudy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.easystudy.domain.*;
import uz.easystudy.dto.AuthDtos.UserResponse;
import uz.easystudy.dto.LearningDtos.*;
import uz.easystudy.dto.PageDto;
import uz.easystudy.repository.*;
import uz.easystudy.security.AuthPrincipal;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository users;
    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final CertificateRepository certificates;
    private final ExamRepository exams;
    private final AttemptRepository attempts;
    private final QuizRepository quizzes;
    private final LessonRepository lessons;
    private final CourseService courseService;

    @Transactional(readOnly = true)
    public AdminStats stats() {
        return new AdminStats(users.count(), courses.count(), courses.countByPublishedTrue(), enrollments.count(),
                certificates.count(), exams.count(), attempts.count());
    }

    // ---------------- foydalanuvchilar (faqat admin) ----------------

    @Transactional(readOnly = true)
    public PageDto<UserResponse> listUsers(String search, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "id"));
        Page<User> p = (search == null || search.isBlank())
                ? users.findAll(pr)
                : users.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search.trim(), search.trim(), pr);
        return new PageDto<>(p.getContent().stream().map(AuthService::toUser).toList(), p.getTotalElements(), page, size);
    }

    @Transactional
    public UserResponse setRole(Long userId, Role role, AuthPrincipal me) {
        if (userId.equals(me.id())) throw AppException.badRequest("O'z rolingizni o'zgartira olmaysiz");
        User u = users.findById(userId).orElseThrow(() -> AppException.notFound("Foydalanuvchi topilmadi"));
        u.setRole(role);
        return AuthService.toUser(u);
    }

    // ---------------- kurs testlari ----------------

    private Quiz managedQuiz(Long quizId, AuthPrincipal me) {
        Quiz q = quizzes.findById(quizId).orElseThrow(() -> AppException.notFound("Test topilmadi"));
        courseService.getManaged(q.getCourse().getId(), me);
        return q;
    }

    private void checkLesson(Long courseId, Long lessonId) {
        if (lessonId != null && lessons.findByIdAndCourseId(lessonId, courseId).isEmpty()) {
            throw AppException.badRequest("Dars bu kursga tegishli emas");
        }
    }

    private void fill(Quiz q, QuizUpsert in) {
        q.setTitle(in.title().trim());
        q.setDescription(in.description() == null ? "" : in.description());
        q.setPassScore(in.passScore());
        q.setLessonId(in.lessonId());
        q.getQuestions().clear();
        int pos = 0;
        for (QuestionInput qi : in.questions()) {
            if (qi.options().stream().noneMatch(OptionInput::correct)) throw AppException.badRequest("Har bir savolda to'g'ri javob belgilanishi kerak");
            QuizQuestion qq = new QuizQuestion();
            qq.setQuiz(q);
            qq.setText(qi.text().trim());
            qq.setPosition(pos++);
            for (OptionInput oi : qi.options()) {
                QuizOption o = new QuizOption();
                o.setQuestion(qq);
                o.setText(oi.text().trim());
                o.setCorrect(oi.correct());
                qq.getOptions().add(o);
            }
            q.getQuestions().add(qq);
        }
    }

    public static QuizAdmin toAdmin(Quiz q) {
        List<QuestionAdmin> qs = new ArrayList<>();
        for (QuizQuestion qq : q.getQuestions()) {
            qs.add(new QuestionAdmin(qq.getId(), qq.getText(),
                    qq.getOptions().stream().map(o -> new OptionAdmin(o.getId(), o.getText(), o.isCorrect())).toList()));
        }
        return new QuizAdmin(q.getId(), q.getCourse().getId(), q.getLessonId(), q.getTitle(), q.getDescription(), q.getPassScore(), qs);
    }

    @Transactional
    public QuizAdmin createQuiz(Long courseId, QuizUpsert in, AuthPrincipal me) {
        Course c = courseService.getManaged(courseId, me);
        checkLesson(c.getId(), in.lessonId());
        Quiz q = new Quiz();
        q.setCourse(c);
        fill(q, in);
        c.getQuizzes().add(q);
        quizzes.save(q);
        c.setUpdatedAt(Instant.now());
        return toAdmin(q);
    }

    @Transactional(readOnly = true)
    public QuizAdmin getQuiz(Long quizId, AuthPrincipal me) {
        return toAdmin(managedQuiz(quizId, me));
    }

    @Transactional
    public QuizAdmin replaceQuiz(Long quizId, QuizUpsert in, AuthPrincipal me) {
        Quiz q = managedQuiz(quizId, me);
        checkLesson(q.getCourse().getId(), in.lessonId());
        fill(q, in);
        q.getCourse().setUpdatedAt(Instant.now());
        return toAdmin(q);
    }

    @Transactional
    public void deleteQuiz(Long quizId, AuthPrincipal me) {
        Quiz q = managedQuiz(quizId, me);
        q.getCourse().getQuizzes().remove(q);
        quizzes.delete(q);
    }
}

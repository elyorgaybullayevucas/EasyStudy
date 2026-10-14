package uz.examprep.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.examprep.domain.Question;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    @Query("select q from Question q join fetch q.section s where s.exam.id = :examId order by s.orderIndex, q.orderIndex")
    List<Question> findAllByExamId(Long examId);
}

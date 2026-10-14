package uz.examprep;

import org.junit.jupiter.api.Test;
import uz.examprep.domain.Question;
import uz.examprep.domain.QuestionType;
import uz.examprep.service.GradingService;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GradingServiceTest {

    private final GradingService grading = new GradingService();

    private static Question q(QuestionType t, List<String> accepted) {
        Question q = new Question();
        q.setType(t);
        q.setAnswerKey(Map.<String, Object>of("accepted", accepted));
        return q;
    }

    @Test
    void gapFillIsCaseAndWhitespaceInsensitive() {
        Question q = q(QuestionType.GAP_FILL, List.of("waggle"));
        assertTrue(grading.isCorrect(q, Map.of("value", "  Waggle ")));
        assertFalse(grading.isCorrect(q, Map.of("value", "wiggle")));
    }

    @Test
    void multiChoiceRequiresExactSet() {
        Question q = q(QuestionType.MULTI_CHOICE, List.of("A", "C"));
        assertTrue(grading.isCorrect(q, Map.of("values", List.of("c", "a"))));
        assertFalse(grading.isCorrect(q, Map.of("values", List.of("a"))));
        assertFalse(grading.isCorrect(q, Map.of("values", List.of("a", "b", "c"))));
    }

    @Test
    void essayIsNotAutoGraded() {
        assertNull(grading.isCorrect(q(QuestionType.ESSAY, List.of()), Map.of("text", "...")));
    }
}

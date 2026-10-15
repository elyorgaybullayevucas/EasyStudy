package uz.easystudy.service;

import org.springframework.stereotype.Service;
import uz.easystudy.domain.Question;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Server tomonda baholash. ESSAY turi avtomatik baholanmaydi (null qaytaradi).
 */
@Service
public class GradingService {

    /** @return true/false, yoki ESSAY uchun null (o'qituvchi tekshiradi). */
    public Boolean isCorrect(Question q, Map<String, Object> response) {
        if (response == null) return false;
        Set<String> accepted = normalise(asList(q.getAnswerKey().get("accepted")));

        return switch (q.getType()) {
            case ESSAY, SPEAKING -> null;
            case SINGLE_CHOICE, TRUE_FALSE_NG, GAP_FILL -> {
                Object v = response.get("value");
                yield v != null && accepted.contains(norm(v.toString()));
            }
            case MULTI_CHOICE, MATCHING -> {
                Set<String> given = normalise(asList(response.get("values")));
                yield !given.isEmpty() && given.equals(accepted);
            }
        };
    }

    private static List<?> asList(Object o) {
        if (o instanceof Collection<?> c) return List.copyOf(c);
        if (o == null) return List.of();
        return List.of(o);
    }

    private static Set<String> normalise(List<?> items) {
        return items.stream().map(Object::toString).map(GradingService::norm).collect(Collectors.toSet());
    }

    private static String norm(String s) {
        return s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}

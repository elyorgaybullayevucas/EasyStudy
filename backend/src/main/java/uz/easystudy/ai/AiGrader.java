package uz.easystudy.ai;

import java.math.BigDecimal;

/** Bitta Writing/Speaking javobini baholaydi. */
public interface AiGrader {

    record Request(String examTitle, String partTitle, String rubric, String task, String studentText,
                   BigDecimal maxPoints, BigDecimal step, Integer minWords) {}

    record Result(BigDecimal points, String feedback) {}

    Result grade(Request request);

    String name();
}

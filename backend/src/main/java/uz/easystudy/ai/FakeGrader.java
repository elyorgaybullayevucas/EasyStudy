package uz.easystudy.ai;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Lokal sinov uchun: so'z soniga qarab deterministik baho, API kaliti kerak emas. */
public class FakeGrader implements AiGrader {

    @Override
    public String name() {
        return "fake";
    }

    @Override
    public Result grade(Request r) {
        int words = r.studentText() == null ? 0 : r.studentText().trim().split("\\s+").length;
        int need = r.minWords() == null ? 100 : r.minWords();
        double ratio = Math.min(1.0, words / (double) need);
        double raw = r.maxPoints().doubleValue() * (0.4 + 0.5 * ratio);
        BigDecimal step = r.step().signum() <= 0 ? BigDecimal.ONE : r.step();
        BigDecimal score = BigDecimal.valueOf(raw).divide(step, 0, RoundingMode.HALF_UP).multiply(step);
        if (score.compareTo(r.maxPoints()) > 0) score = r.maxPoints();
        String fb = "[Sinov rejimi] Javob " + words + " so'zdan iborat" + (words < need ? " (talab: " + need + "). Hajmni oshiring." : ".")
                + " Haqiqiy AI baholash uchun AI_PROVIDER=claude va ANTHROPIC_API_KEY ni sozlang.";
        return new Result(score.setScale(2, RoundingMode.HALF_UP), fb);
    }
}

package uz.easystudy.ai;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.CacheControlEphemeral;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.StructuredMessageCreateParams;
import com.anthropic.models.messages.TextBlockParam;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Claude orqali baholash. Tizim prompti (umumiy qoidalar) keshlanadi, javob tuzilgan JSON (ball + izoh) sifatida qaytadi.
 * Ball maks. qiymat va qadam (0.5 yoki 1) bo'yicha serverda yana tekshiriladi.
 */
@Slf4j
public class ClaudeGrader implements AiGrader {

    public static class GradeOutput {
        @JsonPropertyDescription("Ball: 0 dan maksimal ballgacha, berilgan qadam bilan (masalan IELTS: 0.5 qadam, 0-9)")
        public double score;
        @JsonPropertyDescription("Talabaga 3-6 jumlali izoh o'zbek tilida: kuchli tomonlar, asosiy xatolar (misol bilan), bitta aniq tavsiya")
        public String feedback;
        @JsonPropertyDescription("Mezonlar bo'yicha qisqa taqsimot, masalan 'TA 6, CC 6.5, LR 6, GRA 5.5'")
        public String breakdown;
    }

    private static final String SYSTEM = """
            Siz xalqaro va milliy til/fan imtihonlarining tajribali, qat'iy lekin adolatli imtihonchisisiz.
            Vazifa: talabaning javobini berilgan baholash mezonlari bo'yicha baholash.
            Qoidalar:
            - Faqat berilgan mezonlar va ball shkalasidan foydalaning; haqiqiy imtihon standartini saqlang (yuqori ballni oson bermang).
            - Javob mavzudan chetga chiqsa, juda qisqa bo'lsa yoki yodlangan shablon bo'lsa, buni ballda aks ettiring.
            - Speaking transkripti bo'lsa, talaffuzni baholay olmaysiz: Fluency, Lexical Resource, Grammar bo'yicha baholang va buni izohda ayting.
            - Izoh o'zbek tilida, aniq misollar bilan, talabaga foydali bo'lsin. Maqtovdan ko'ra aniq xatolar va tavsiya muhim.
            - Ballni faqat ruxsat etilgan qadam bilan bering.
            """;

    private final AnthropicClient client;
    private final String model;

    public ClaudeGrader(String apiKey, String model) {
        this.client = apiKey == null || apiKey.isBlank() ? AnthropicOkHttpClient.fromEnv() : AnthropicOkHttpClient.builder().apiKey(apiKey).build();
        this.model = model == null || model.isBlank() ? "claude-opus-5-5" : model;
    }

    @Override
    public String name() {
        return "claude:" + model;
    }

    @Override
    public Result grade(Request r) {
        String user = """
                IMTIHON: %s
                BO'LIM: %s
                BALL SHKALASI: 0 dan %s gacha, qadam %s.%s

                BAHOLASH MEZONLARI:
                %s

                TOPSHIRIQ:
                %s

                TALABA JAVOBI:
                <<<
                %s
                >>>
                """.formatted(r.examTitle(), r.partTitle(), r.maxPoints().stripTrailingZeros().toPlainString(),
                r.step().stripTrailingZeros().toPlainString(),
                r.minWords() == null ? "" : " Minimal so'z soni: " + r.minWords() + ".",
                r.rubric(), r.task(), r.studentText());

        StructuredMessageCreateParams<GradeOutput> params = MessageCreateParams.builder()
                .model(model)
                .maxTokens(8000L)
                .outputConfig(GradeOutput.class)
                .systemOfTextBlockParams(List.of(TextBlockParam.builder().text(SYSTEM)
                        .cacheControl(CacheControlEphemeral.builder().build()).build()))
                .addUserMessage(user)
                .build();

        GradeOutput out = client.messages().create(params).content().stream()
                .flatMap(cb -> cb.text().stream())
                .map(t -> t.text())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("AI javob bermadi"));

        BigDecimal step = r.step().signum() <= 0 ? BigDecimal.ONE : r.step();
        BigDecimal score = BigDecimal.valueOf(out.score).divide(step, 0, RoundingMode.HALF_UP).multiply(step);
        if (score.signum() < 0) score = BigDecimal.ZERO;
        if (score.compareTo(r.maxPoints()) > 0) score = r.maxPoints();
        String fb = (out.feedback == null ? "" : out.feedback.trim())
                + (out.breakdown == null || out.breakdown.isBlank() ? "" : "\n(" + out.breakdown.trim() + ")");
        return new Result(score.setScale(2, RoundingMode.HALF_UP), fb);
    }
}

package uz.easystudy.ai;

import uz.easystudy.domain.PartType;

import java.math.BigDecimal;

/** Shablon va bo'lim turiga qarab baholash mezonlari (prompt matni) va ball qadami. */
public final class Rubrics {
    private Rubrics() {}

    public record Rubric(String text, BigDecimal step) {}

    private static final String IELTS_WRITING = """
            IELTS Writing band descriptors (0-9, 0.5 qadam). To'rt mezon teng vaznda:
            1) Task Achievement/Response: savolning barcha qismlariga javob, aniq pozitsiya, rivojlangan va misollar bilan asoslangan fikrlar; Task 1 da asosiy xususiyatlar va overview.
            2) Coherence & Cohesion: mantiqiy tartib, paragraflar, bog'lovchilarning tabiiy ishlatilishi, referensiya.
            3) Lexical Resource: lug'at kengligi va aniqligi, kollokatsiyalar, kam uchraydigan so'zlarning to'g'ri ishlatilishi, imlo.
            4) Grammatical Range & Accuracy: murakkab gaplar xilma-xilligi, xatosiz gaplar ulushi, punktuatsiya.
            Band 5: cheklangan, ko'p xato; Band 6: yetarli, ba'zi xatolar; Band 7: yaxshi, kam xato, murakkab tuzilmalar; Band 8: juda yaxshi, kamdan-kam xato; Band 9: ekspert.
            So'z soni minimumdan kam bo'lsa Task Achievement pasayadi. Yakuniy band = to'rt mezon o'rtachasi (pastga .5 ga yaxlitlang).
            """;
    private static final String IELTS_SPEAKING = """
            IELTS Speaking band descriptors (0-9, 0.5 qadam), transkript asosida:
            1) Fluency & Coherence: uzun, bog'langan javoblar, takror va o'zini tuzatishlar kamligi, mantiqiy rivojlanish.
            2) Lexical Resource: mavzuga mos lug'at, idiomatik til, parafraza.
            3) Grammatical Range & Accuracy: murakkab tuzilmalar, xatosiz gaplar ulushi.
            4) Pronunciation: transkriptdan baholab bo'lmaydi; o'rtachani faqat qolgan uch mezon bo'yicha hisoblang va izohda buni ayting.
            Juda qisqa javoblar (1-2 jumla) Band 5 dan oshmaydi.
            """;
    private static final String CEFR_WRITING = """
            CEFR (Milliy sertifikat) Writing, 0-100 ball:
            - Vazifa bajarilishi va mazmun (25): barcha punktlar yoritilgan, mos uslub (rasmiy/norasmiy), so'z hajmi.
            - Tashkil (25): paragraflar, mantiqiy ketma-ketlik, bog'lovchilar.
            - Lug'at (25): kenglik, aniqlik, imlo.
            - Grammatika (25): xilma-xillik va aniqlik.
            Taxminiy darajalar: 50-64 B1, 65-79 B2, 80+ C1.
            """;
    private static final String CEFR_SPEAKING = """
            CEFR (Milliy sertifikat) Speaking, 0-100 ball, transkript asosida (talaffuz baholanmaydi):
            - Mazmun va vazifa bajarilishi (35), ravonlik va bog'liqlik (25), lug'at (20), grammatika (20).
            Taxminiy darajalar: 50-64 B1, 65-79 B2, 80+ C1.
            """;
    private static final String TOPIK_WRITING = """
            TOPIK II 쓰기 baholash (maksimal ball vazifaga qarab 10/30/50):
            - 51-52: har bo'sh joy uchun grammatik to'g'rilik va kontekstga moslik (har biri 5 ball).
            - 53: ma'lumotni to'liq va aniq tasvirlash (12), tuzilma (6), til (12).
            - 54: mazmun va vazifa bajarilishi (12), matn tuzilishi (12), til: lug'at, grammatika, uslub (26).
            Belgilar soni talabdan kam bo'lsa ball kamayadi; qoralama uslubi (반말) rasmiy yozuvda xato.
            """;
    private static final String GENERIC = """
            Umumiy mezonlar (0 dan maksimal ballgacha): vazifaga mos javob va mazmun (40%), tuzilma va mantiq (20%), til aniqligi va boyligi (40%).
            """;

    public static Rubric forTask(String templateCode, PartType part, BigDecimal maxPoints) {
        String t = templateCode == null ? "" : templateCode.toUpperCase();
        boolean speaking = part == PartType.SPEAKING;
        if (t.startsWith("IELTS")) return new Rubric(speaking ? IELTS_SPEAKING : IELTS_WRITING, new BigDecimal("0.5"));
        if (t.startsWith("MILLIY")) return new Rubric(speaking ? CEFR_SPEAKING : CEFR_WRITING, BigDecimal.ONE);
        if (t.startsWith("TOPIK")) return new Rubric(TOPIK_WRITING, BigDecimal.ONE);
        BigDecimal step = maxPoints != null && maxPoints.compareTo(BigDecimal.TEN) <= 0 ? new BigDecimal("0.5") : BigDecimal.ONE;
        return new Rubric(GENERIC, step);
    }
}

package uz.easystudy.service;

import uz.easystudy.domain.PartType;
import uz.easystudy.domain.ScoringMode;
import uz.easystudy.dto.ExamDtos.BandRow;
import uz.easystudy.dto.ExamDtos.TemplateInfo;
import uz.easystudy.dto.ExamDtos.TemplateSection;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Haqiqiy imtihon formatlari. Shablondan yaratilganda bo'limlar, vaqt, ball, konversiya jadvallari
 * va Writing/Speaking savollari tayyor keladi; o'qituvchi faqat material (matn, audio, rasm, savollar) qo'shadi.
 */
public final class ExamTemplates {
    private ExamTemplates() {}

    /** Shablondan yaratiladigan savol (Writing/Speaking vazifalari). */
    public record SeedQuestion(String prompt, String type, BigDecimal points, BigDecimal weight, Integer minWords,
                               Integer prepSeconds, Integer answerSeconds) {}

    public record Template(TemplateInfo info, Map<Integer, List<BandRow>> sectionBands, List<BandRow> overallBands,
                           Map<Integer, List<SeedQuestion>> seedQuestions) {}

    private static BigDecimal d(String s) { return new BigDecimal(s); }
    private static BandRow b(int min, int max, String scaled) { return new BandRow(min, max, d(scaled), null); }
    private static BandRow b(int min, int max, String scaled, String label) { return new BandRow(min, max, d(scaled), label); }

    private static final List<BandRow> IELTS_LISTENING = List.of(
            b(39, 40, "9"), b(37, 38, "8.5"), b(35, 36, "8"), b(32, 34, "7.5"), b(30, 31, "7"), b(26, 29, "6.5"),
            b(23, 25, "6"), b(18, 22, "5.5"), b(16, 17, "5"), b(13, 15, "4.5"), b(10, 12, "4"), b(8, 9, "3.5"),
            b(6, 7, "3"), b(4, 5, "2.5"), b(0, 3, "2"));
    private static final List<BandRow> IELTS_READING_AC = List.of(
            b(39, 40, "9"), b(37, 38, "8.5"), b(35, 36, "8"), b(33, 34, "7.5"), b(30, 32, "7"), b(27, 29, "6.5"),
            b(23, 26, "6"), b(19, 22, "5.5"), b(15, 18, "5"), b(13, 14, "4.5"), b(10, 12, "4"), b(8, 9, "3.5"),
            b(6, 7, "3"), b(4, 5, "2.5"), b(0, 3, "2"));
    private static final List<BandRow> IELTS_READING_GT = List.of(
            b(40, 40, "9"), b(39, 39, "8.5"), b(37, 38, "8"), b(36, 36, "7.5"), b(34, 35, "7"), b(32, 33, "6.5"),
            b(30, 31, "6"), b(27, 29, "5.5"), b(23, 26, "5"), b(19, 22, "4.5"), b(15, 18, "4"), b(12, 14, "3.5"),
            b(9, 11, "3"), b(6, 8, "2.5"), b(0, 5, "2"));

    private static List<BandRow> linear(int questions, int min, int max) {
        List<BandRow> rows = new ArrayList<>();
        for (int i = 0; i <= questions; i++) {
            int scaled = (int) Math.round((min + (double) (max - min) * i / questions) / 10.0) * 10;
            rows.add(b(i, i, String.valueOf(scaled)));
        }
        return rows;
    }

    private static List<BandRow> percent(int maxRaw) {
        List<BandRow> rows = new ArrayList<>();
        for (int i = 0; i <= maxRaw; i++) rows.add(b(i, i, String.valueOf(Math.round(i * 100.0 / maxRaw))));
        return rows;
    }

    private static final List<SeedQuestion> IELTS_WRITING = List.of(
            new SeedQuestion("Task 1. (Academic: grafik/jadval/diagramma tavsifi; General: xat.) Kamida 150 so'z. Tavsiya: 20 daqiqa.", "ESSAY", d("9"), d("1"), 150, null, null),
            new SeedQuestion("Task 2. Berilgan mavzuda esse yozing. Kamida 250 so'z. Tavsiya: 40 daqiqa.", "ESSAY", d("9"), d("2"), 250, null, null));
    private static final List<SeedQuestion> IELTS_SPEAKING = List.of(
            new SeedQuestion("Part 1. O'zingiz, uyingiz, ishingiz/o'qishingiz va qiziqishlaringiz haqida savollar.", "SPEAKING", d("9"), d("1"), null, 10, 240),
            new SeedQuestion("Part 2. Cue card: mavzu bo'yicha 1-2 daqiqa gapiring (1 daqiqa tayyorlanish).", "SPEAKING", d("9"), d("1"), null, 60, 120),
            new SeedQuestion("Part 3. Part 2 mavzusi bo'yicha chuqurroq muhokama savollari.", "SPEAKING", d("9"), d("1"), null, 10, 300));
    private static final List<SeedQuestion> MILLIY_WRITING = List.of(
            new SeedQuestion("Task 1. Rasmiy/norasmiy xat yoki hisobot. Kamida 120 so'z.", "ESSAY", d("100"), d("1"), 120, null, null),
            new SeedQuestion("Task 2. Esse: fikr bildirish / muammo-yechim. Kamida 200 so'z.", "ESSAY", d("100"), d("1"), 200, null, null));
    private static final List<SeedQuestion> MILLIY_SPEAKING = List.of(
            new SeedQuestion("Part 1. Shaxsiy savollar.", "SPEAKING", d("100"), d("1"), null, 10, 180),
            new SeedQuestion("Part 2. Rasm/mavzu bo'yicha monolog (1 daqiqa tayyorlanish).", "SPEAKING", d("100"), d("1"), null, 60, 120),
            new SeedQuestion("Part 3. Muhokama savollari.", "SPEAKING", d("100"), d("1"), null, 10, 240));
    private static final List<SeedQuestion> TOPIK2_WRITING = List.of(
            new SeedQuestion("51. Bo'sh joylarni mos jumla bilan to'ldiring (2 ta bo'sh joy).", "ESSAY", d("10"), d("1"), null, null, null),
            new SeedQuestion("52. Bo'sh joylarni mos jumla bilan to'ldiring (2 ta bo'sh joy).", "ESSAY", d("10"), d("1"), null, null, null),
            new SeedQuestion("53. Berilgan grafik/ma'lumot asosida 200-300 belgi matn yozing.", "ESSAY", d("30"), d("1"), 200, null, null),
            new SeedQuestion("54. Mavzu bo'yicha 600-700 belgi esse yozing.", "ESSAY", d("50"), d("1"), 600, null, null));

    private static TemplateSection s(String title, PartType pt, int min, String points, int qCount, String types, String instr, boolean manual) {
        return new TemplateSection(title, pt, min, d(points), qCount, types, instr, manual);
    }

    public static final List<Template> ALL = List.of(
            new Template(new TemplateInfo("IELTS_ACADEMIC", "IELTS Academic", "INTERNATIONAL",
                    "4 ta bo'lim: Listening (40 savol), Reading (40 savol), Writing (2 task), Speaking (3 part). Har bo'lim band 1-9, umumiy band = o'rtacha.",
                    ScoringMode.SECTION_AVERAGE, "Listening/Reading: to'g'ri javoblar soni -> band (rasmiy jadval). Writing/Speaking: o'qituvchi band qo'yadi (Task 2 vazni 2).", 170,
                    List.of(
                            s("Listening", PartType.LISTENING, 40, "1", 40, "GAP_FILL, SINGLE_CHOICE, MATCHING", "4 ta qism, 40 savol. Audio bir marta eshittiriladi. Javoblarni ko'chirish uchun 10 daqiqa qo'shilgan.", false),
                            s("Reading", PartType.READING, 60, "1", 40, "TRUE_FALSE_NG, GAP_FILL, SINGLE_CHOICE, MATCHING", "3 ta matn, 40 savol, 60 daqiqa.", false),
                            s("Writing", PartType.WRITING, 60, "9", 2, "ESSAY", "Task 1 (150+ so'z, 20 daq) va Task 2 (250+ so'z, 40 daq).", true),
                            s("Speaking", PartType.SPEAKING, 15, "9", 3, "SPEAKING", "3 qism: suhbat, cue card (1 daqiqa tayyorlanish, 2 daqiqa javob), muhokama. Mikrofon orqali yoziladi.", true))),
                    Map.of(0, IELTS_LISTENING, 1, IELTS_READING_AC), List.of(), Map.of(2, IELTS_WRITING, 3, IELTS_SPEAKING)),

            new Template(new TemplateInfo("IELTS_GENERAL", "IELTS General Training", "INTERNATIONAL",
                    "Listening, Reading (GT jadvali), Writing (xat + esse), Speaking.",
                    ScoringMode.SECTION_AVERAGE, "Reading GT konversiyasi Academic'dan farq qiladi (jadval tayyor).", 170,
                    List.of(
                            s("Listening", PartType.LISTENING, 40, "1", 40, "GAP_FILL, SINGLE_CHOICE, MATCHING", "4 qism, 40 savol.", false),
                            s("Reading", PartType.READING, 60, "1", 40, "TRUE_FALSE_NG, GAP_FILL, SINGLE_CHOICE", "3 bo'lim, 40 savol.", false),
                            s("Writing", PartType.WRITING, 60, "9", 2, "ESSAY", "Task 1 xat (150+ so'z), Task 2 esse (250+ so'z).", true),
                            s("Speaking", PartType.SPEAKING, 15, "9", 3, "SPEAKING", "3 qism.", true))),
                    Map.of(0, IELTS_LISTENING, 1, IELTS_READING_GT), List.of(), Map.of(2, IELTS_WRITING, 3, IELTS_SPEAKING)),

            new Template(new TemplateInfo("SAT", "Digital SAT", "INTERNATIONAL",
                    "Reading and Writing (54 savol, 64 daq) va Math (44 savol, 70 daq). Har bo'lim 200-800, umumiy 400-1600.",
                    ScoringMode.SECTION_SUM, "Har bo'lim: to'g'ri javoblar -> 200-800 shkala (chiziqli yaqinlashuv), umumiy = yig'indi.", 134,
                    List.of(
                            s("Reading and Writing", PartType.READING, 64, "1", 54, "SINGLE_CHOICE", "2 modul, 54 savol, 64 daqiqa. Har savol 4 variantli.", false),
                            s("Math", PartType.MATH, 70, "1", 44, "SINGLE_CHOICE, GAP_FILL", "2 modul, 44 savol, 70 daqiqa. Kalkulyator ruxsat. Ochiq javobli savollar GAP_FILL.", false))),
                    Map.of(0, linear(54, 200, 800), 1, linear(44, 200, 800)), List.of(), Map.of()),

            new Template(new TemplateInfo("TOPIK_I", "TOPIK I (1-2 daraja)", "INTERNATIONAL",
                    "Listening (30 savol, 40 daq) va Reading (40 savol, 60 daq). Jami 200 ball: 80+ = 1-daraja, 140+ = 2-daraja.",
                    ScoringMode.TOTAL, "Savol ballari 3-4 (rasmiy taqsimot bo'yicha o'zgartiring). Umumiy ball -> daraja.", 100,
                    List.of(
                            s("듣기 Listening", PartType.LISTENING, 40, "3.33", 30, "SINGLE_CHOICE", "30 savol, 100 ball.", false),
                            s("읽기 Reading", PartType.READING, 60, "2.5", 40, "SINGLE_CHOICE", "40 savol, 100 ball.", false))),
                    Map.of(), List.of(b(0, 79, "0", "Darajasiz"), b(80, 139, "1", "1-daraja"), b(140, 200, "2", "2-daraja")), Map.of()),

            new Template(new TemplateInfo("TOPIK_II", "TOPIK II (3-6 daraja)", "INTERNATIONAL",
                    "Listening (50 savol), Writing (4 vazifa), Reading (50 savol). Jami 300 ball: 120/150/190/230 = 3/4/5/6-daraja.",
                    ScoringMode.TOTAL, "Writing: 51-52 (10 ball), 53 (30), 54 (50) o'qituvchi baholaydi.", 180,
                    List.of(
                            s("듣기 Listening", PartType.LISTENING, 60, "2", 50, "SINGLE_CHOICE", "50 savol, 100 ball.", false),
                            s("쓰기 Writing", PartType.WRITING, 50, "25", 4, "ESSAY", "4 vazifa, 100 ball.", true),
                            s("읽기 Reading", PartType.READING, 70, "2", 50, "SINGLE_CHOICE", "50 savol, 100 ball.", false))),
                    Map.of(), List.of(b(0, 119, "0", "Darajasiz"), b(120, 149, "3", "3-daraja"), b(150, 189, "4", "4-daraja"), b(190, 229, "5", "5-daraja"), b(230, 300, "6", "6-daraja")),
                    Map.of(1, TOPIK2_WRITING)),

            new Template(new TemplateInfo("MILLIY_ENGLISH", "Milliy sertifikat: Ingliz tili", "LOCAL_CERT",
                    "CEFR formatida 4 ko'nikma: Listening, Reading, Writing, Speaking. Har ko'nikma 0-100%, umumiy o'rtacha -> B1/B2/C1.",
                    ScoringMode.SECTION_AVERAGE, "Listening/Reading: to'g'ri javoblar foizi. Writing/Speaking: o'qituvchi 0-100 ball qo'yadi. Umumiy: 50-64 B1, 65-79 B2, 80+ C1.", 160,
                    List.of(
                            s("Listening", PartType.LISTENING, 35, "1", 35, "SINGLE_CHOICE, GAP_FILL, MATCHING", "35 savol, audio bir marta.", false),
                            s("Reading", PartType.READING, 60, "1", 35, "SINGLE_CHOICE, TRUE_FALSE_NG, GAP_FILL, MATCHING", "35 savol.", false),
                            s("Writing", PartType.WRITING, 45, "100", 2, "ESSAY", "2 vazifa: xat/hisobot (120+ so'z) va esse (200+ so'z).", true),
                            s("Speaking", PartType.SPEAKING, 20, "100", 3, "SPEAKING", "3 qism, mikrofon orqali yoziladi.", true))),
                    Map.of(0, percent(35), 1, percent(35)),
                    List.of(b(0, 49, "0", "A2 va past"), b(50, 64, "1", "B1"), b(65, 79, "2", "B2"), b(80, 100, "3", "C1")),
                    Map.of(2, MILLIY_WRITING, 3, MILLIY_SPEAKING)),

            new Template(new TemplateInfo("MILLIY_SUBJECT", "Milliy sertifikat: fan (matematika, fizika...)", "LOCAL_CERT",
                    "Yopiq va ochiq savollar, 2 qism. Natija 0-100 ball, daraja: 50+ B1, 65+ B2, 80+ C1 (fanga qarab o'zgartiring).",
                    ScoringMode.TOTAL, "Barcha savollar avtomatik tekshiriladi; ballarni umumiy 100 bo'lishiga moslab qo'ying.", 180,
                    List.of(
                            s("1-qism: yopiq testlar", PartType.GENERAL, 90, "2", 25, "SINGLE_CHOICE", "25 savol, 4 variant.", false),
                            s("2-qism: ochiq savollar", PartType.GENERAL, 90, "5", 10, "GAP_FILL", "10 savol, javob raqam yoki qisqa ibora.", false))),
                    Map.of(), List.of(b(0, 49, "0", "Sertifikatsiz"), b(50, 64, "1", "B1"), b(65, 79, "2", "B2"), b(80, 100, "3", "C1")), Map.of()),

            new Template(new TemplateInfo("DTM", "DTM (universitetga kirish testi)", "LOCAL_CERT",
                    "Majburiy fanlar: Ona tili (10), Matematika (10), O'zbekiston tarixi (10) - har biri 1.1 ball. 1-mutaxassislik fan (30) - 3.1 ball, 2-mutaxassislik (30) - 2.1 ball. Maks 189 ball, 3 soat.",
                    ScoringMode.TOTAL, "Umumiy ball = to'g'ri javoblar x fan koeffitsienti. Shkalasiz, ball to'g'ridan-to'g'ri ko'rsatiladi.", 180,
                    List.of(
                            s("Ona tili (majburiy)", PartType.GENERAL, 20, "1.1", 10, "SINGLE_CHOICE", "10 savol, 1.1 ball.", false),
                            s("Matematika (majburiy)", PartType.MATH, 25, "1.1", 10, "SINGLE_CHOICE", "10 savol, 1.1 ball.", false),
                            s("O'zbekiston tarixi (majburiy)", PartType.GENERAL, 15, "1.1", 10, "SINGLE_CHOICE", "10 savol, 1.1 ball.", false),
                            s("1-mutaxassislik fani", PartType.GENERAL, 60, "3.1", 30, "SINGLE_CHOICE", "30 savol, 3.1 ball.", false),
                            s("2-mutaxassislik fani", PartType.GENERAL, 60, "2.1", 30, "SINGLE_CHOICE", "30 savol, 2.1 ball.", false))),
                    Map.of(), List.of(), Map.of()),

            new Template(new TemplateInfo("ATTESTATSIYA", "Attestatsiya (o'qituvchilar)", "LOCAL_CERT",
                    "Mutaxassislik fani (50 savol) va pedagogika/metodika (20 savol). Foiz bo'yicha toifa.",
                    ScoringMode.TOTAL, "Ballar foizga aylantiriladi: 56-70% ikkinchi, 71-85% birinchi, 86%+ oliy toifa (mavjud tartibga moslang).", 120,
                    List.of(
                            s("Mutaxassislik fani", PartType.GENERAL, 90, "1", 50, "SINGLE_CHOICE", "50 savol.", false),
                            s("Pedagogika va metodika", PartType.GENERAL, 30, "1", 20, "SINGLE_CHOICE", "20 savol.", false))),
                    Map.of(), List.of(b(0, 38, "0", "Toifasiz"), b(39, 49, "2", "Ikkinchi toifa"), b(50, 59, "1", "Birinchi toifa"), b(60, 70, "3", "Oliy toifa")), Map.of()),

            // ---- bo'limli mashqlar (dars -> mavzu bo'yicha mock) ----
            new Template(new TemplateInfo("IELTS_LISTENING", "IELTS Listening mashqi (1 bo'lim)", "PRACTICE",
                    "Faqat Listening: 4 qism, 40 savol, rasmiy band jadvali. Darsga bog'lab, mavzu mashqi sifatida bering.",
                    ScoringMode.SECTION_AVERAGE, "To'g'ri javoblar -> band (rasmiy jadval).", 40,
                    List.of(s("Listening", PartType.LISTENING, 40, "1", 40, "GAP_FILL, SINGLE_CHOICE, MATCHING", "4 qism, 40 savol. Audio bir marta.", false))),
                    Map.of(0, IELTS_LISTENING), List.of(), Map.of()),
            new Template(new TemplateInfo("IELTS_READING", "IELTS Reading mashqi (1 bo'lim)", "PRACTICE",
                    "Faqat Academic Reading: 3 matn, 40 savol, 60 daqiqa.", ScoringMode.SECTION_AVERAGE, "To'g'ri javoblar -> band.", 60,
                    List.of(s("Reading", PartType.READING, 60, "1", 40, "TRUE_FALSE_NG, GAP_FILL, SINGLE_CHOICE, MATCHING", "3 matn, 40 savol.", false))),
                    Map.of(0, IELTS_READING_AC), List.of(), Map.of()),
            new Template(new TemplateInfo("IELTS_WRITING", "IELTS Writing mashqi (1 bo'lim)", "PRACTICE",
                    "Faqat Writing: Task 1 + Task 2, 60 daqiqa. AI/o'qituvchi baholaydi.", ScoringMode.SECTION_AVERAGE, "Band 0-9, Task 2 vazni 2.", 60,
                    List.of(s("Writing", PartType.WRITING, 60, "9", 2, "ESSAY", "Task 1 (150+ so'z) va Task 2 (250+ so'z).", true))),
                    Map.of(), List.of(), Map.of(0, IELTS_WRITING)),
            new Template(new TemplateInfo("IELTS_SPEAKING", "IELTS Speaking mashqi (1 bo'lim)", "PRACTICE",
                    "Faqat Speaking: 3 qism, mikrofon orqali.", ScoringMode.SECTION_AVERAGE, "Band 0-9.", 15,
                    List.of(s("Speaking", PartType.SPEAKING, 15, "9", 3, "SPEAKING", "3 qism.", true))),
                    Map.of(), List.of(), Map.of(0, IELTS_SPEAKING)),
            new Template(new TemplateInfo("DTM_SUBJECT", "DTM fan mashqi (1 fan, 30 savol)", "PRACTICE",
                    "Bitta fan bo'yicha 30 ta DTM uslubidagi savol, 60 daqiqa. Darsga bog'lab mavzu mashqi sifatida bering.",
                    ScoringMode.TOTAL, "To'g'ri javoblar soni x ball (standart 3.1).", 60,
                    List.of(s("Fan testi", PartType.GENERAL, 60, "3.1", 30, "SINGLE_CHOICE", "30 savol, 4 variant.", false))),
                    Map.of(), List.of(), Map.of()),

            new Template(new TemplateInfo("CUSTOM", "Bo'sh (o'zim tuzaman)", "OTHER",
                    "Bo'limlarsiz boshlanadi; hamma narsani o'zingiz qo'shasiz.", ScoringMode.TOTAL, "Umumiy ball; xohlasangiz konversiya jadvali qo'shing.", 0, List.of()),
                    Map.of(), List.of(), Map.of())
    );

    public static Optional<Template> find(String code) {
        return ALL.stream().filter(t -> t.info().code().equalsIgnoreCase(code)).findFirst();
    }

    public static List<TemplateInfo> infos() {
        return ALL.stream().map(Template::info).toList();
    }
}

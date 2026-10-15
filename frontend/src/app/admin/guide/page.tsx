import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "O'qituvchi yo'riqnomasi" };

type Step = { title: string; items: string[] };
type Guide = { code: string; title: string; summary: string; steps: Step[] };

const general: Step[] = [
  { title: "Umumiy qoidalar", items: [
    "Imtihonni \"Mock imtihonlar → Yangi imtihon\" dan shablon tanlab yarating. Bo'limlar, vaqt, ball va konversiya jadvallari tayyor keladi.",
    "Har bo'limda \"Savollar\" (material), \"Sozlamalar va audio\" (yo'riqnoma, vaqt, audio) va \"Konversiya\" (xom ball → band) bo'limlari bor.",
    "Kod noyob bo'lsin: IELTS_AC_2025_01 kabi. Nomi talabaga ko'rinadi.",
    "Nashr qilishdan oldin: har bo'limda savol bo'lishi, Listening bo'limida audio yuklangan bo'lishi shart. Aks holda tizim nashr qilishga yo'l qo'ymaydi.",
    "Talaba bo'limlarni ketma-ket topshiradi, har bo'limning o'z taymeri bor, bo'limga qaytib bo'lmaydi.",
  ] },
  { title: "Fayllar", items: [
    "Audio: MP3, 200 MB gacha. Bitta bo'lim = bitta audio fayl (barcha qismlar ketma-ket, haqiqiy imtihondagidek pauzalar bilan).",
    "Rasm: JPG/PNG/WebP, 10 MB gacha. Writing Task 1 grafigi, SAT diagrammasi, Speaking cue card uchun.",
    "Video kurs darslari uchun: MP4 (H.264), 2 GB gacha. Hammasi platformada saqlanadi, talaba yuklab ololmaydi.",
    "Reading matnini savolning \"Matn / parcha\" maydoniga qo'ying. Bir matn bir nechta savolga tegishli bo'lsa, matnni birinchi savolga qo'ying va keyingi savollarda \"1-matnga qarang\" deb yozing.",
  ] },
  { title: "Savol turlari", items: [
    "Bitta javob: A/B/C/D, bittasi to'g'ri. Bir nechta javob: bir nechta to'g'ri (hammasi tanlansa ball beriladi).",
    "Bo'sh joyni to'ldirish: qabul qilinadigan javoblarni vergul bilan yozing (colour, color). Katta-kichik harf va bo'shliqlar farqlanmaydi.",
    "True/False/Not Given: variantlar avtomatik.",
    "Yozma javob (Writing): maks. ball va minimal so'z sonini kiriting. Siz \"Tekshirish navbati\"da baholaysiz.",
    "Ovozli javob (Speaking): tayyorlanish va javob vaqtini soniyada kiriting. Talaba brauzerda bir marta yozadi; siz eshitib baholaysiz.",
  ] },
  { title: "AI tekshiruv (Writing va Speaking)", items: [
    "Talaba topshirgach Writing javoblari darhol AI tomonidan rasmiy mezonlar (IELTS band descriptors, CEFR, TOPIK) asosida baholanadi va izoh bilan natijada ko'rinadi; umumiy band shu zahoti hisoblanadi.",
    "Speaking: audio avval matnga aylantiriladi (transkripsiya sozlangan bo'lsa), so'ng AI baholaydi; sozlanmagan bo'lsa Speaking sizning tekshiruvingizga qoladi.",
    "AI bahosi 'Tekshirish navbati → Barchasi' da ko'rinadi (AI baholagan belgisi). Ballni o'zgartirsangiz sizning bahoyingiz yakuniy bo'ladi va natija qayta hisoblanadi.",
    "Vazifa matnini aniq yozing (mavzu, talab, so'z soni): AI aynan shu topshiriqqa nisbatan baholaydi.",
  ] },
  { title: "Baholash usullari", items: [
    "Umumiy ball: barcha xom ballar qo'shiladi, umumiy jadval orqali daraja (TOPIK, DTM, Milliy fan).",
    "Bo'limlar o'rtachasi: har bo'lim o'z jadvali bilan band oladi, umumiy = o'rtacha, IELTS qoidasi bilan .5 ga yaxlitlanadi (IELTS, Milliy ingliz tili).",
    "Bo'limlar yig'indisi: har bo'lim shkalasi qo'shiladi (SAT: 200-800 + 200-800).",
    "Qo'lda baholanadigan bo'limda jadval bo'lmasa, sizning ballaringizning vaznli o'rtachasi band bo'ladi (IELTS Writing: Task 2 vazni 2).",
  ] },
];

const guides: Guide[] = [
  { code: "IELTS_ACADEMIC", title: "IELTS Academic / General", summary: "4 bo'lim: Listening 40 savol (30+10 daq), Reading 40 savol (60 daq), Writing 2 task (60 daq), Speaking 3 part (11-14 daq).", steps: [
    { title: "Listening", items: ["Bitta MP3 yuklang: 4 qism, har qism oldidan yo'riqnoma, savollarni o'qish uchun pauzalar. Davomiyligi ~30 daqiqa.", "40 ta savol: 1-10 (suhbat), 11-20 (monolog), 21-30 (o'quv suhbati), 31-40 (ma'ruza). Turlari: bo'sh joy (so'z/raqam), bitta javob, moslashtirish.", "Bo'sh joy savollarida barcha to'g'ri yozilishlarni kiriting: \"15th May, 15 May, May 15\".", "Konversiya jadvali tayyor (rasmiy): 39-40 → 9.0, 30-31 → 7.0, 23-25 → 6.0."] },
    { title: "Reading", items: ["3 ta matn (Academic: 700-900 so'zli akademik matnlar; General: e'lon, ko'rsatma, ish matni). Har matn ~13 savol.", "Matnni birinchi savolning \"Matn / parcha\" maydoniga qo'ying.", "Turlari: True/False/Not Given, Yes/No/Not Given (bitta javob sifatida), sarlavha moslashtirish (moslashtirish), bo'sh joy, bitta javob.", "Jadval tayyor: Academic va General uchun alohida."] },
    { title: "Writing", items: ["Task 1 va Task 2 shablondan keladi. Task 1 matniga topshiriqni yozing va grafik/jadval rasmini yuklang (Academic) yoki xat vaziyatini yozing (General).", "Task 2 ga esse mavzusini yozing. Minimal so'z: 150 / 250.", "Baholash: 0-9 band, 0.5 qadam. Task 2 vazni 2 (tizim o'rtachani o'zi hisoblaydi). Baholash mezonlari: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy."] },
    { title: "Speaking", items: ["Part 1 (4-5 daqiqa): 3-4 savolni bitta vazifa matniga yozing; talaba ketma-ket javob beradi.", "Part 2: cue card matnini yozing (\"Describe a ... You should say: ...\") yoki rasm sifatida yuklang. Tayyorlanish 60 s, javob 120 s.", "Part 3: 3-4 muhokama savoli, javob 300 s gacha.", "Baholash: 0-9 band: Fluency & Coherence, Lexical Resource, Grammatical Range, Pronunciation. Izohda aniq tavsiyalar yozing."] },
  ] },
  { code: "SAT", title: "Digital SAT", summary: "Reading and Writing (54 savol, 64 daq) va Math (44 savol, 70 daq). Har bo'lim 200-800, umumiy 400-1600.", steps: [
    { title: "Reading and Writing", items: ["Har savol qisqa matn (25-150 so'z) + 4 variantli savol. Matnni \"Matn / parcha\"ga, savolni \"Savol\"ga yozing.", "Mavzular: Information and Ideas, Craft and Structure, Expression of Ideas, Standard English Conventions.", "Jadval tayyor: to'g'ri javoblar soni → 200-800 (chiziqli). Xohlasangiz rasmiy jadvalga moslang."] },
    { title: "Math", items: ["~75% bitta javob (4 variant), ~25% ochiq javob (bo'sh joy: raqam, masalan \"3/4\" va \"0.75\" ikkalasini ham kiriting).", "Grafik va jadvallarni rasm sifatida yuklang.", "Kalkulyator ruxsat etilganini yo'riqnomada yozing."] },
  ] },
  { code: "TOPIK", title: "TOPIK I / II", summary: "TOPIK I: Listening 30 + Reading 40 (200 ball). TOPIK II: Listening 50 + Writing 4 + Reading 50 (300 ball).", steps: [
    { title: "Listening (듣기)", items: ["Bitta MP3: barcha savollar ketma-ket, koreys tilidagi yo'riqnomalar bilan.", "Har savol 4 variantli. Ballar: TOPIK I da 3-4, TOPIK II da 2 (standart ball bo'limda sozlangan)."] },
    { title: "Writing (쓰기, faqat TOPIK II)", items: ["51-52: gap to'ldirish (10 ball), 53: grafik asosida 200-300 belgi (30 ball), 54: esse 600-700 belgi (50 ball). Shablondan tayyor.", "53-savol uchun grafik rasmini yuklang."] },
    { title: "Reading (읽기)", items: ["Har savol 4 variantli; uzun matnlarni \"Matn / parcha\"ga qo'ying.", "Darajalar umumiy jadvalda: TOPIK I 80/140, TOPIK II 120/150/190/230."] },
  ] },
  { code: "MILLIY", title: "Milliy sertifikat (ingliz tili va fanlar)", summary: "Ingliz tili: 4 ko'nikma, CEFR (B1/B2/C1). Fanlar: yopiq + ochiq savollar, 100 ballik.", steps: [
    { title: "Ingliz tili", items: ["Listening/Reading: 35 tadan savol; jadval foizga aylantiradi (tayyor).", "Writing: 2 vazifa (xat/hisobot 120+ so'z, esse 200+ so'z), 0-100 ball.", "Speaking: 3 qism, 0-100 ball. Umumiy: 4 ko'nikma o'rtachasi → 50-64 B1, 65-79 B2, 80+ C1 (umumiy konversiya jadvalida o'zgartirish mumkin)."] },
    { title: "Fanlar (matematika, fizika, kimyo, biologiya, tarix...)", items: ["1-qism: 25 ta yopiq test (2 ball), 2-qism: 10 ta ochiq savol (5 ball) — ballarni rasmiy taqsimotga moslang.", "Formulalar va chizmalarni rasm sifatida yuklang. Ochiq javoblarda barcha ekvivalent shakllarni kiriting: \"0.5, 1/2, 0,5\".", "Umumiy jadval: 50+ B1, 65+ B2, 80+ C1."] },
  ] },
  { code: "DTM", title: "DTM (universitetga kirish)", summary: "Majburiy: ona tili, matematika, tarix (10 tadan, 1.1 ball). 1-mutaxassislik (30 ta, 3.1), 2-mutaxassislik (30 ta, 2.1). Maks 189 ball, 3 soat.", steps: [
    { title: "Tuzish", items: ["Shablon 5 bo'limni to'g'ri ball bilan yaratadi. Mutaxassislik bo'limlarining nomini fan nomiga o'zgartiring (masalan \"Fizika (1-mutaxassislik)\").", "Har savol 4 variantli (A-D), bittasi to'g'ri. Variantlarda formulalar bo'lsa rasm yuklang.", "Konversiya shart emas: umumiy ball to'g'ridan-to'g'ri ko'rsatiladi. Xohlasangiz umumiy jadvalga \"grant ehtimoli\" kabi yorliqlar qo'shing."] },
    { title: "Vaqt", items: ["Rasmiy DTM da umumiy 3 soat; shablonda bo'limlarga taxminan taqsimlangan. Haqiqiyga yaqin bo'lishi uchun bo'lim vaqtlarini o'zgartirishingiz mumkin."] },
  ] },
  { code: "ATTESTATSIYA", title: "Attestatsiya", summary: "Mutaxassislik fani (50 savol) + pedagogika/metodika (20 savol). Foizga qarab toifa.", steps: [
    { title: "Tuzish", items: ["Har savol 4 variantli. Umumiy jadval toifalarni beradi; joriy tartibga moslab o'zgartiring.", "Normativ hujjatlardan savollar uchun manba nomini savol matniga qo'shib qo'ying."] },
  ] },
];

export default function GuidePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">O&apos;qituvchi yo&apos;riqnomasi: mock imtihon materiallari</h1>
        <p className="mt-1 text-sm text-slate-600">Har bir imtihon turi uchun qanday material tayyorlash va qaysi holatda yuklash. <Link href="/admin/exams/new" className="text-brand-700 underline">Yangi imtihon yaratish</Link></p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {guides.map((g) => <a key={g.code} href={`#${g.code}`} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50">{g.title}</a>)}
      </nav>
      <section className="card p-6">
        <h2 className="text-lg font-bold">Avval o&apos;qing</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {general.map((s) => (
            <div key={s.title}>
              <h3 className="font-semibold">{s.title}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>
      {guides.map((g) => (
        <section key={g.code} id={g.code} className="card scroll-mt-24 p-6">
          <h2 className="text-lg font-bold">{g.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{g.summary}</p>
          <div className="mt-4 space-y-5">
            {g.steps.map((s) => (
              <div key={s.title}>
                <h3 className="font-semibold text-brand-800">{s.title}</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

import type { Lang } from "./i18n";

// Illustrative course / resource content (mirrors the design mockup).
export function eligibleCourses(lang: Lang) {
  const ar = lang === "ar";
  return [
    { code: "CS 340", title: ar ? "نظم التشغيل" : "Operating Systems", cr: 3, prereq: "CS 240", cat: ar ? "متطلب تخصص" : "CS Core" },
    { code: "CS 360", title: ar ? "قواعد البيانات" : "Database Systems", cr: 3, prereq: "CS 240", cat: ar ? "متطلب تخصص" : "CS Core" },
    { code: "CS 350", title: ar ? "الخوارزميات" : "Algorithms", cr: 3, prereq: "CS 240, MATH 251", cat: ar ? "متطلب تخصص" : "CS Core" },
    { code: "CS 370", title: ar ? "شبكات الحاسوب" : "Computer Networks", cr: 3, prereq: "CS 240", cat: ar ? "اختياري حاسوب" : "CS Elective" },
    { code: "STAT 320", title: ar ? "الإحصاء التطبيقي" : "Applied Statistics", cr: 3, prereq: "MATH 102", cat: ar ? "رياضيات" : "Mathematics" },
    { code: "ENGL 210", title: ar ? "الكتابة التقنية" : "Technical Writing", cr: 3, prereq: "ENGL 110", cat: ar ? "متطلب جامعة" : "University Req." },
  ];
}

export function lockedCourses(lang: Lang) {
  const ar = lang === "ar";
  return [
    { code: "CS 440", title: ar ? "تعلّم الآلة" : "Machine Learning", cr: 3, reason: ar ? "يتطلب CS 350" : "Requires CS 350" },
    { code: "CS 420", title: ar ? "المترجمات" : "Compilers", cr: 3, reason: ar ? "يتطلب CS 340" : "Requires CS 340" },
    { code: "CS 460", title: ar ? "الذكاء الاصطناعي" : "Artificial Intelligence", cr: 3, reason: ar ? "يتطلب CS 350" : "Requires CS 350" },
    { code: "CS 490", title: ar ? "مشروع التخرج" : "Senior Project", cr: 3, reason: ar ? "يتطلب ٩٠ ساعة" : "Requires 90 credits" },
  ];
}

export function videos(lang: Lang) {
  const ar = lang === "ar";
  const defs = [
    { course: "CS 350", en: "Algorithms, Part I", ar: "الخوارزميات — الجزء الأول", source: "MIT OpenCourseWare", len: ar ? "٢٤ محاضرة" : "24 lectures", tone: "#2C6E91" },
    { course: "CS 340", en: "Operating Systems Course", ar: "دورة نظم التشغيل", source: "Neso Academy", len: "5h 12m", tone: "#1E8378" },
    { course: "CS 360", en: "Databases — Full Course", ar: "قواعد البيانات — دورة كاملة", source: "freeCodeCamp", len: "8h 04m", tone: "#2C6E91" },
    { course: "CS 240", en: "Object-Oriented Programming", ar: "البرمجة الكائنية", source: "CS50 — Harvard", len: "1h 45m", tone: "#C2566A" },
    { course: "STAT 320", en: "Statistics Fundamentals", ar: "أساسيات الإحصاء", source: "StatQuest", len: "3h 20m", tone: "#B5762E" },
    { course: "CS 440", en: "Machine Learning Specialization", ar: "تخصص تعلّم الآلة", source: "DeepLearning.AI", len: ar ? "٦ أسابيع" : "6 weeks", tone: "#2C6E91" },
  ];
  return defs.map((v) => ({ course: v.course, title: ar ? v.ar : v.en, source: v.source, length: v.len, tone: v.tone }));
}

export function tutors(lang: Lang) {
  const ar = lang === "ar";
  const defs = [
    { name: "Maryam Al-Hashemi", en: "Statistics & Machine Learning", ar: "الإحصاء وتعلّم الآلة", rating: "5.0", sessions: 142, av: "#2C6E91", initials: "MH" },
    { name: "Yousef Al-Rashidi", en: "Algorithms & Data Structures", ar: "الخوارزميات وهياكل البيانات", rating: "4.9", sessions: 120, av: "#2C6E91", initials: "YR" },
    { name: "Dana Al-Otaibi", en: "Databases & SQL", ar: "قواعد البيانات و SQL", rating: "4.8", sessions: 86, av: "#1E8378", initials: "DA" },
    { name: "Khaled Al-Sayegh", en: "Operating Systems & C", ar: "نظم التشغيل ولغة C", rating: "4.7", sessions: 64, av: "#C2566A", initials: "KS" },
  ];
  return defs.map((t) => ({
    name: t.name, focus: ar ? t.ar : t.en, rating: t.rating, av: t.av, initials: t.initials,
    sessionsLabel: ar ? `${t.sessions} جلسة` : `${t.sessions} sessions`,
  }));
}

export const PARSE_STAGES = (lang: Lang) => {
  const ar = lang === "ar";
  return [
    { th: 20, text: ar ? "استخراج فئات المتطلبات" : "Extracting requirement categories" },
    { th: 40, text: ar ? "ربط سلاسل المتطلبات السابقة" : "Mapping prerequisite chains" },
    { th: 60, text: ar ? "حساب الساعات المكتملة" : "Tallying completed credits" },
    { th: 80, text: ar ? "تحديد المواد المتاحة" : "Computing eligible courses" },
    { th: 100, text: ar ? "تقدير موعد التخرج" : "Estimating graduation date" },
  ];
};

export function suggestedPrompts(lang: Lang) {
  return lang === "ar"
    ? ["متى سأتخرّج؟", "ماذا آخذ الفصل القادم؟", "كم تبقّى من المواد الاختيارية؟", "هل أستطيع أخذ تعلّم الآلة؟"]
    : ["When will I graduate?", "What can I take next term?", "How many electives are left?", "Can I take Machine Learning yet?"];
}

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
  // Real, public, long-stable YouTube courses (full-length, free).
  const defs = [
    { course: "CS 350", en: "Algorithms & Data Structures — Full Course", ar: "الخوارزميات وهياكل البيانات — دورة كاملة", source: "freeCodeCamp", len: ar ? "٨ ساعات" : "8 hours", id: "RBSGKlAvoiM" },
    { course: "CS 340", en: "Operating Systems — Full Course", ar: "نظم التشغيل — دورة كاملة", source: "freeCodeCamp", len: ar ? "٣ ساعات" : "3 hours", id: "mXw9ruZaxzQ" },
    { course: "CS 360", en: "Databases & SQL — Full Course", ar: "قواعد البيانات و SQL — دورة كاملة", source: "freeCodeCamp", len: "4h 20m", id: "HXV3zeQKqGY" },
    { course: "CS 240", en: "Programming with Python (CS50)", ar: "البرمجة بلغة بايثون (CS50)", source: "Harvard CS50", len: ar ? "١٥ ساعة" : "15 hours", id: "nLRL_NcnK-4" },
    { course: "STAT 320", en: "Statistics — Full University Course", ar: "الإحصاء — دورة جامعية كاملة", source: "freeCodeCamp", len: "8h 16m", id: "xxpc-HPKN28" },
    { course: "CS 440", en: "Machine Learning for Everybody", ar: "تعلّم الآلة للجميع", source: "freeCodeCamp", len: "3h 53m", id: "i_LwzRVP7bg" },
  ];
  return defs.map((v) => ({
    course: v.course,
    title: ar ? v.ar : v.en,
    source: v.source,
    length: v.len,
    id: v.id,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    thumb: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
  }));
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

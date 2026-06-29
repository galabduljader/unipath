"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Lang = "en" | "ar";

const EN = {
    welcome: "Welcome back", catalog: "Catalog", credits: "credits", cr: "cr", crShort: "cr", complete: "complete", remaining: "Credits remaining",
    degreeProgress: "Degree progress", expectedGrad: "Expected graduation", semestersLeft: "Semesters left", pace: "Pace", onTrack: "On track",
    pathTitle: "Your path to graduation", pathSub: "Semester-by-semester, from where you started to the cap.", lgCompleted: "Completed", lgUpNext: "Up next", lgPlanned: "Planned", graduation: "Graduation",
    reqCategories: "Degree requirements", eligibleTitle: "Eligible next term", eligibleSub: "Prerequisites met — ready for Fall 2026.", prereqMet: "Prerequisite met", viewAllCourses: "View all courses & plan",
    eligibleNow: "Eligible now", eligibleNowSub: "Prerequisites satisfied — you can register for these.", prereq: "Prereq", locked: "Locked courses", lockedSub: "Prerequisites not yet met.",
    done: "Completed", remTotal: "Remaining", addToPlan: "Add to plan", added: "Added",
    upTitle: "Upload your major sheet", upSub: "We'll read your degree plan — requirements, credits and prerequisites — and map exactly where you stand.", dropHere: "Drop your degree sheet here", constraints: "PDF or DOCX · up to 10MB", browse: "Browse files", useSample: "Use a sample sheet",
    parsing: "Reading your degree plan", parseSub: "The AI is parsing requirements, credits and prerequisites.", reviewTitle: "Review the parsed plan", reviewSub: "Here's what we found. Confirm the courses you've completed.", markCompleted: "Mark completed courses", looksGood: "Looks right — build my plan",
    chatTitle: "AI Advisor", chatScope: "Scoped to your degree plan", askPlaceholder: "Ask about your degree plan…", notifsTitle: "Notifications", markAllRead: "Mark all read", viewAllNotifs: "View all notifications",
    searchUsers: "Search users…", allRoles: "All", student: "Student", admin: "Admin", role: "Role", program: "Program", joined: "Joined", status: "Status", active: "Active", disabled: "Disabled", colUser: "User",
    auditNote: "All account changes are recorded in the audit log.", uStep1: "Extract requirements", uStep2: "Map prerequisites", uStep3: "Estimate graduation",
    navGrades: "Grades & GPA", navResources: "Resources", navNotes: "Notes",
    cumGpa: "Cumulative GPA", gpaScale: "on a 4.0 scale", gradedCredits: "Graded credits", qualityPoints: "Quality points", standing: "Standing",
    yourGrades: "Your grades", yourGradesSub: "Adjust any grade to recalculate your real GPA instantly.", colCourse: "Course", grade: "Grade", term: "Term",
    deansList: "Dean's List", goodStanding: "Good standing", satisfactory: "Satisfactory", probation: "Probation",
    resourcesIntro: "Curated for your major — matched to your current and upcoming courses.",
    videoSources: "Video sources", videoSourcesSub: "Lectures and walkthroughs picked for the courses on your plan.", tutors: "Tutors", tutorsSub: "Peer and faculty tutors who specialise in your major.", book: "Book",
    notesTitle: "Reminders", notesSub: "Assignments, deadlines and to-dos.", notepad: "Notepad", notepadSub: "Anything you want to remember.", saved: "Saved", addReminder: "Add", reminderPh: "New reminder…", noReminders: "Nothing yet — add your first reminder.", due: "Due", noCourse: "No course",
    title_grades: "Grades & GPA", title_resources: "Resources", title_notes: "Notes & Reminders",
    tagline: "Your degree, mapped.", authPitch: "Every requirement, prerequisite and credit — for any university — in one clear path to graduation.",
    feat1: "See exactly what's left", feat2: "Know your real GPA", feat3: "Plan term by term",
    welcomeBack: "Welcome back", loginSub: "Sign in to continue to your degree plan.", createAccount: "Create your account", signupSub: "Join UNI Path and map your path to graduation.",
    username: "Username", phone: "Phone number", email: "Email", password: "Password", confirmPassword: "Confirm password",
    signIn: "Sign in", signUp: "Create account", noAccount: "New to UNI Path?", haveAccount: "Already have an account?", useDemo: "Explore the demo account", signOut: "Sign out", demoHint: "Demo: layla.m@coded.edu.kw · password123",
    obProfile: "Your major", obCohortStep: "Your cohort", obUploadStep: "Major sheet", obCoursesStep: "Completed courses",
    obProfileTitle: "Tell us where you study", obProfileSub: "Pick your university and major so we read the right degree plan.", chooseUniversity: "University", chooseMajor: "Major", selectOpt: "Select…",
    obCohortTitle: "Which cohort are you in?", obCohortSub: "Your catalog year decides which requirements apply to you.", cohortHint: "Catalog year",
    obUploadTitle: "Upload your major sheet", obUploadSub: "We'll parse the requirements, credits and prerequisites for your plan.",
    obCoursesTitle: "Tick off what you've finished", obCoursesSub: "Select every course you've already completed so we know where you stand.",
    next: "Continue", back: "Back", finish: "Finish setup", stepOf: "Step",
    dashboard: "Dashboard", myPlan: "My Plan", aiAdvisor: "AI Advisor", uploadSheet: "Upload Sheet", notifications: "Notifications", adminNav: "Admin",
    title_upload: "Upload Major Sheet", title_admin: "User Management",
    detectedProgram: "Detected program", totalCredits: "Total credits", coursesFound: "Courses found", prereqsMapped: "Prereqs mapped",
    eligibleNowStat: "Eligible now", creditsRemainingStat: "Credits remaining", lockedStat: "Locked courses", totalUsers: "Total users", activeAccounts: "Active accounts", admins: "Admins",
    aiUnavailable: "AI key not set — using the built-in advisor.",
};

export type Dict = typeof EN;

const AR: Dict = {
    welcome: "أهلاً بعودتك", catalog: "دليل", credits: "ساعة", cr: "س", crShort: "س", complete: "مكتمل", remaining: "ساعات متبقية",
    degreeProgress: "تقدّم الدرجة", expectedGrad: "التخرج المتوقع", semestersLeft: "فصول متبقية", pace: "الوتيرة", onTrack: "على المسار",
    pathTitle: "مسارك نحو التخرج", pathSub: "فصلاً بفصل، من بدايتك حتى التخرج.", lgCompleted: "مكتملة", lgUpNext: "التالي", lgPlanned: "مخطّطة", graduation: "التخرج",
    reqCategories: "متطلبات الدرجة", eligibleTitle: "متاحة للفصل القادم", eligibleSub: "المتطلبات السابقة مكتملة — جاهزة لخريف ٢٠٢٦.", prereqMet: "المتطلب مكتمل", viewAllCourses: "عرض كل المواد والخطة",
    eligibleNow: "متاحة الآن", eligibleNowSub: "المتطلبات السابقة مكتملة — يمكنك تسجيلها.", prereq: "المتطلب", locked: "مواد مقفلة", lockedSub: "المتطلبات السابقة لم تكتمل بعد.",
    done: "مكتملة", remTotal: "متبقية", addToPlan: "أضف للخطة", added: "أُضيفت",
    upTitle: "ارفع كشف تخصصك", upSub: "سنقرأ خطتك الدراسية — المتطلبات والساعات والمتطلبات السابقة — ونحدّد موقعك بدقة.", dropHere: "اسحب كشف الدرجة هنا", constraints: "PDF أو DOCX · حتى ١٠ ميجابايت", browse: "تصفّح الملفات", useSample: "استخدم نموذجاً تجريبياً",
    parsing: "جارٍ قراءة خطتك الدراسية", parseSub: "يقوم الذكاء الاصطناعي بتحليل المتطلبات والساعات والمتطلبات السابقة.", reviewTitle: "راجع الخطة المكتشفة", reviewSub: "هذا ما وجدناه. أكّدي المواد التي أكملتها.", markCompleted: "حدّدي المواد المكتملة", looksGood: "تبدو صحيحة — ابنِ خطتي",
    chatTitle: "المرشد الذكي", chatScope: "مخصّص لخطتك الدراسية", askPlaceholder: "اسأل عن خطتك الدراسية…", notifsTitle: "الإشعارات", markAllRead: "تعليم الكل كمقروء", viewAllNotifs: "عرض كل الإشعارات",
    searchUsers: "ابحث عن مستخدم…", allRoles: "الكل", student: "طالب", admin: "مشرف", role: "الدور", program: "التخصص", joined: "انضم", status: "الحالة", active: "نشط", disabled: "معطّل", colUser: "المستخدم",
    auditNote: "تُسجَّل كل التغييرات على الحسابات في سجل التدقيق.", uStep1: "استخراج المتطلبات", uStep2: "ربط المتطلبات السابقة", uStep3: "تقدير موعد التخرج",
    navGrades: "الدرجات والمعدل", navResources: "المصادر", navNotes: "الملاحظات",
    cumGpa: "المعدل التراكمي", gpaScale: "من ٤٫٠", gradedCredits: "ساعات محتسبة", qualityPoints: "نقاط الجودة", standing: "الوضع الأكاديمي",
    yourGrades: "درجاتك", yourGradesSub: "عدّلي أي درجة ليُعاد حساب معدّلك الحقيقي فوراً.", colCourse: "المادة", grade: "الدرجة", term: "الفصل",
    deansList: "قائمة الشرف", goodStanding: "وضع جيد", satisfactory: "مقبول", probation: "إنذار",
    resourcesIntro: "مختارة لتخصصك — مرتبطة بموادك الحالية والقادمة.",
    videoSources: "مصادر الفيديو", videoSourcesSub: "محاضرات وشروحات مختارة لمواد خطتك.", tutors: "المدرّسون", tutorsSub: "مدرّسون من الزملاء وأعضاء هيئة التدريس متخصّصون في مجالك.", book: "احجز",
    notesTitle: "التذكيرات", notesSub: "الواجبات والمواعيد والمهام.", notepad: "المفكرة", notepadSub: "كل ما تريدين تذكّره.", saved: "تم الحفظ", addReminder: "إضافة", reminderPh: "تذكير جديد…", noReminders: "لا شيء بعد — أضيفي أول تذكير.", due: "الاستحقاق", noCourse: "بدون مادة",
    title_grades: "الدرجات والمعدل", title_resources: "المصادر", title_notes: "الملاحظات والتذكيرات",
    tagline: "درجتك، مرسومة بوضوح.", authPitch: "كل متطلب ومتطلب سابق وساعة معتمدة — لأي جامعة — في مسار واحد واضح نحو التخرج.",
    feat1: "اعرفي ما تبقّى بالضبط", feat2: "اعرفي معدّلك الحقيقي", feat3: "خطّطي فصلاً بفصل",
    welcomeBack: "أهلاً بعودتك", loginSub: "سجّلي الدخول للمتابعة إلى خطتك الدراسية.", createAccount: "أنشئي حسابك", signupSub: "انضمّي إلى يوني باث وارسمي مسارك نحو التخرج.",
    username: "اسم المستخدم", phone: "رقم الهاتف", email: "البريد الإلكتروني", password: "كلمة المرور", confirmPassword: "تأكيد كلمة المرور",
    signIn: "تسجيل الدخول", signUp: "إنشاء حساب", noAccount: "جديدة على يوني باث؟", haveAccount: "لديك حساب بالفعل؟", useDemo: "جرّبي الحساب التجريبي", signOut: "تسجيل الخروج", demoHint: "تجريبي: layla.m@coded.edu.kw · password123",
    obProfile: "تخصصك", obCohortStep: "دفعتك", obUploadStep: "كشف التخصص", obCoursesStep: "المواد المكتملة",
    obProfileTitle: "أخبرينا أين تدرسين", obProfileSub: "اختاري جامعتك وتخصصك لنقرأ الخطة الدراسية الصحيحة.", chooseUniversity: "الجامعة", chooseMajor: "التخصص", selectOpt: "اختاري…",
    obCohortTitle: "في أي دفعة أنتِ؟", obCohortSub: "سنة الدليل تحدّد المتطلبات التي تنطبق عليك.", cohortHint: "سنة الدليل",
    obUploadTitle: "ارفعي كشف تخصصك", obUploadSub: "سنحلّل المتطلبات والساعات والمتطلبات السابقة لخطتك.",
    obCoursesTitle: "حدّدي ما أنهيتِه", obCoursesSub: "اختاري كل مادة أكملتها لنعرف موقعك بدقة.",
    next: "متابعة", back: "رجوع", finish: "إنهاء الإعداد", stepOf: "خطوة",
    dashboard: "لوحة التحكم", myPlan: "خطة الدراسة", aiAdvisor: "المرشد الذكي", uploadSheet: "رفع الخطة", notifications: "الإشعارات", adminNav: "الإدارة",
    title_upload: "رفع كشف التخصص", title_admin: "إدارة المستخدمين",
    detectedProgram: "التخصص المكتشف", totalCredits: "إجمالي الساعات", coursesFound: "المواد المكتشفة", prereqsMapped: "متطلبات سابقة",
    eligibleNowStat: "متاحة الآن", creditsRemainingStat: "ساعة متبقية", lockedStat: "مواد مقفلة", totalUsers: "إجمالي المستخدمين", activeAccounts: "حسابات نشطة", admins: "مشرفون",
    aiUnavailable: "مفتاح الذكاء الاصطناعي غير مُعدّ — يُستخدم المرشد المدمج.",
};

export const DICT: Record<Lang, Dict> = { en: EN, ar: AR };

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: Dict;
  toggleLang: () => void;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unipath_lang") as Lang | null;
      if (saved === "en" || saved === "ar") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    try {
      localStorage.setItem("unipath_lang", lang);
    } catch {}
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(
    () => setLangState((l) => (l === "en" ? "ar" : "en")),
    []
  );

  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <LanguageContext.Provider value={{ lang, dir, t: DICT[lang], toggleLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}

export const langSwitchLabel = (lang: Lang) => (lang === "en" ? "العربية" : "English");

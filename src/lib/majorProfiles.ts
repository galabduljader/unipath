import type { Lang } from "./i18n";

type LS = { en: string; ar: string };
type Skill = { en: string; ar: string; icon: string };
type Tool = { name: string; icon: string };

export type MajorProfile = {
  tagline: LS;
  whatIs: LS;
  skills: Skill[];
  careers: LS[];
  tools: Tool[];
  funFact: LS;
  goal: LS;
};

const COMPUTING: MajorProfile = {
  tagline: { en: "Turning ideas into software, and data into decisions.", ar: "تحويل الأفكار إلى برمجيات، والبيانات إلى قرارات." },
  whatIs: {
    en: "This is where logic meets creativity. You learn to build software, work with data, and solve real problems with technology.",
    ar: "هنا يلتقي المنطق بالإبداع. تتعلّم بناء البرمجيات والعمل مع البيانات وحلّ مشكلات حقيقية بالتقنية.",
  },
  skills: [
    { en: "Problem solving", ar: "حل المشكلات", icon: "lightbulb" },
    { en: "Programming", ar: "البرمجة", icon: "code" },
    { en: "Data & algorithms", ar: "البيانات والخوارزميات", icon: "analytics" },
    { en: "Databases", ar: "قواعد البيانات", icon: "database" },
    { en: "Teamwork", ar: "العمل الجماعي", icon: "groups" },
    { en: "Critical thinking", ar: "التفكير الناقد", icon: "psychology" },
  ],
  careers: [
    { en: "Software Engineer", ar: "مهندس برمجيات" },
    { en: "Data Analyst", ar: "محلل بيانات" },
    { en: "Systems Analyst", ar: "محلل أنظمة" },
    { en: "Web / App Developer", ar: "مطوّر ويب وتطبيقات" },
    { en: "Database Administrator", ar: "مدير قواعد بيانات" },
    { en: "AI / ML Engineer", ar: "مهندس ذكاء اصطناعي" },
  ],
  tools: [
    { name: "Python", icon: "code" },
    { name: "SQL", icon: "database" },
    { name: "VS Code", icon: "terminal" },
    { name: "GitHub", icon: "merge" },
    { name: "Power BI", icon: "bar_chart" },
    { name: "Figma", icon: "design_services" },
  ],
  funFact: { en: "Computing pros are the bridge between people, ideas, and machines.", ar: "متخصّصو الحاسوب هم الجسر بين الناس والأفكار والآلات." },
  goal: { en: "To build things that make life easier — and a little more fun.", ar: "بناء أشياء تجعل الحياة أسهل وأكثر متعة." },
};

const BUSINESS: MajorProfile = {
  tagline: { en: "Turning numbers into strategy, and ideas into impact.", ar: "تحويل الأرقام إلى استراتيجية، والأفكار إلى أثر." },
  whatIs: {
    en: "Business is the art of making smart decisions. You learn how companies plan, sell, manage money, and grow.",
    ar: "الأعمال فنّ اتخاذ القرارات الذكية. تتعلّم كيف تخطّط الشركات وتبيع وتدير المال وتنمو.",
  },
  skills: [
    { en: "Strategic thinking", ar: "التفكير الاستراتيجي", icon: "strategy" },
    { en: "Communication", ar: "التواصل", icon: "chat" },
    { en: "Financial literacy", ar: "الثقافة المالية", icon: "payments" },
    { en: "Leadership", ar: "القيادة", icon: "groups" },
    { en: "Analysis", ar: "التحليل", icon: "analytics" },
    { en: "Negotiation", ar: "التفاوض", icon: "handshake" },
  ],
  careers: [
    { en: "Business Analyst", ar: "محلل أعمال" },
    { en: "Financial Analyst", ar: "محلل مالي" },
    { en: "Marketing Manager", ar: "مدير تسويق" },
    { en: "Accountant", ar: "محاسب" },
    { en: "Entrepreneur", ar: "رائد أعمال" },
    { en: "Project Manager", ar: "مدير مشاريع" },
  ],
  tools: [
    { name: "Excel", icon: "table_chart" },
    { name: "Power BI", icon: "bar_chart" },
    { name: "QuickBooks", icon: "receipt_long" },
    { name: "Tableau", icon: "insights" },
    { name: "PowerPoint", icon: "slideshow" },
    { name: "Notion", icon: "sticky_note_2" },
  ],
  funFact: { en: "Every great product started as a business idea on a napkin.", ar: "كل منتج عظيم بدأ كفكرة أعمال على ورقة صغيرة." },
  goal: { en: "To lead, build, and create value that lasts.", ar: "أن أقود وأبني وأصنع قيمة تدوم." },
};

const ENGINEERING: MajorProfile = {
  tagline: { en: "Designing the systems that move the world.", ar: "تصميم الأنظمة التي تُحرّك العالم." },
  whatIs: {
    en: "Engineering turns science into things you can use — machines, circuits, structures, and systems that work.",
    ar: "الهندسة تحوّل العلم إلى أشياء تُستخدم — آلات ودوائر ومنشآت وأنظمة تعمل.",
  },
  skills: [
    { en: "Problem solving", ar: "حل المشكلات", icon: "lightbulb" },
    { en: "Math & physics", ar: "الرياضيات والفيزياء", icon: "functions" },
    { en: "Design", ar: "التصميم", icon: "architecture" },
    { en: "Analysis", ar: "التحليل", icon: "analytics" },
    { en: "Teamwork", ar: "العمل الجماعي", icon: "groups" },
    { en: "Attention to detail", ar: "الدقّة", icon: "precision_manufacturing" },
  ],
  careers: [
    { en: "Design Engineer", ar: "مهندس تصميم" },
    { en: "Project Engineer", ar: "مهندس مشاريع" },
    { en: "Systems Engineer", ar: "مهندس أنظمة" },
    { en: "Consultant", ar: "استشاري" },
    { en: "Operations Engineer", ar: "مهندس تشغيل" },
    { en: "Researcher", ar: "باحث" },
  ],
  tools: [
    { name: "MATLAB", icon: "calculate" },
    { name: "AutoCAD", icon: "architecture" },
    { name: "SolidWorks", icon: "view_in_ar" },
    { name: "Python", icon: "code" },
    { name: "Excel", icon: "table_chart" },
    { name: "Simulink", icon: "schema" },
  ],
  funFact: { en: "Engineers don't just solve problems — they prevent them.", ar: "المهندسون لا يحلّون المشكلات فحسب — بل يمنعون حدوثها." },
  goal: { en: "To design things that make life safer and better.", ar: "أن أصمّم أشياء تجعل الحياة أأمن وأفضل." },
};

const GENERAL: MajorProfile = {
  tagline: { en: "Every step you take brings you closer to your goal.", ar: "كل خطوة تخطوها تقرّبك من هدفك." },
  whatIs: {
    en: "Your major builds knowledge, skills, and a way of thinking that opens many doors. This map shows the path.",
    ar: "تخصّصك يبني المعرفة والمهارات وطريقة تفكير تفتح أبواباً كثيرة. هذه الخريطة تُظهر الطريق.",
  },
  skills: [
    { en: "Critical thinking", ar: "التفكير الناقد", icon: "psychology" },
    { en: "Research", ar: "البحث", icon: "search" },
    { en: "Communication", ar: "التواصل", icon: "chat" },
    { en: "Problem solving", ar: "حل المشكلات", icon: "lightbulb" },
    { en: "Writing", ar: "الكتابة", icon: "edit_note" },
    { en: "Teamwork", ar: "العمل الجماعي", icon: "groups" },
  ],
  careers: [
    { en: "Specialist", ar: "أخصّائي" },
    { en: "Consultant", ar: "استشاري" },
    { en: "Researcher", ar: "باحث" },
    { en: "Educator", ar: "معلّم" },
    { en: "Analyst", ar: "محلل" },
    { en: "Manager", ar: "مدير" },
  ],
  tools: [
    { name: "Word", icon: "description" },
    { name: "Excel", icon: "table_chart" },
    { name: "PowerPoint", icon: "slideshow" },
    { name: "Google Scholar", icon: "school" },
    { name: "Notion", icon: "sticky_note_2" },
    { name: "Zotero", icon: "menu_book" },
  ],
  funFact: { en: "There's no single 'right' pace — yours is exactly right.", ar: "لا توجد وتيرة واحدة صحيحة — وتيرتك هي الصحيحة تماماً." },
  goal: { en: "To grow into the person — and professional — I want to be.", ar: "أن أنمو لأصبح الشخص والمحترف الذي أريده." },
};

const COMPUTING_MAJORS = new Set(["Computer Science", "Computer Engineering", "Information Systems"]);
const BUSINESS_MAJORS = new Set(["Business Administration", "Accounting", "Finance", "Marketing"]);
const ENGINEERING_MAJORS = new Set(["Electrical Engineering", "Mechanical Engineering", "Civil Engineering"]);

export function getMajorProfile(major: string): MajorProfile {
  if (COMPUTING_MAJORS.has(major)) return COMPUTING;
  if (BUSINESS_MAJORS.has(major)) return BUSINESS;
  if (ENGINEERING_MAJORS.has(major)) return ENGINEERING;
  return GENERAL;
}

export function pick(ls: LS, lang: Lang) {
  return lang === "ar" ? ls.ar : ls.en;
}

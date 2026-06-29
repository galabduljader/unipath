import type { Lang, Dict } from "./i18n";

export const UNIVERSITIES = [
  "Kuwait University",
  "International University of Kuwait (IUK)",
  "Gulf University for Science & Technology",
  "American University of Kuwait",
  "American University of the Middle East",
  "Australian College of Kuwait",
  "Box Hill College Kuwait",
  "Kuwait College of Science & Technology",
  "Arab Open University",
];

export const MAJORS = [
  "Computer Science", "Computer Engineering", "Information Systems",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "Business Administration", "Accounting", "Finance", "Marketing",
  "Architecture", "Mathematics", "Biology", "Chemistry", "Graphic Design",
  "Nursing", "Law", "English Literature",
];

export const COHORTS = ["2021", "2022", "2023", "2024", "2025", "2026"];

// [code, English title, Arabic title, credits]
export type CourseTuple = [string, string, string, number];

export const MAJOR_COURSES: Record<string, CourseTuple[]> = {
  "Computer Science": [["CS 120","Intro to Programming","مقدمة في البرمجة",3],["CS 140","Data Structures","هياكل البيانات",3],["CS 199","Discrete Mathematics","الرياضيات المتقطعة",3],["CS 220","Computer Organization","تنظيم الحاسوب",3],["CS 240","Object-Oriented Programming","البرمجة الكائنية",3],["CS 280","Software Engineering","هندسة البرمجيات",3],["CS 300","Theory of Computation","نظرية الحوسبة",3],["CS 340","Operating Systems","نظم التشغيل",3],["CS 350","Algorithms","الخوارزميات",3],["CS 360","Database Systems","أنظمة قواعد البيانات",3],["CS 370","Computer Networks","شبكات الحاسوب",3],["CS 440","Machine Learning","تعلّم الآلة",3],["CS 460","Artificial Intelligence","الذكاء الاصطناعي",3],["CS 490","Senior Project","مشروع التخرج",3]],
  "Computer Engineering": [["CPE 110","Intro to Engineering","مقدمة في الهندسة",3],["CS 120","Programming Fundamentals","أساسيات البرمجة",3],["PHYS 101","Physics I","الفيزياء ١",4],["PHYS 102","Physics II","الفيزياء ٢",4],["CPE 210","Digital Logic Design","تصميم المنطق الرقمي",3],["CPE 230","Circuits I","الدوائر الكهربائية ١",3],["CPE 240","Electronics","الإلكترونيات",3],["CPE 260","Microprocessors","المعالجات الدقيقة",3],["CPE 310","Signals & Systems","الإشارات والأنظمة",3],["CPE 340","Embedded Systems","الأنظمة المدمجة",3],["CPE 360","Computer Networks","شبكات الحاسوب",3],["CPE 410","VLSI Design","تصميم الدوائر المتكاملة",3],["CPE 450","Control Systems","أنظمة التحكم",3],["CPE 490","Senior Design","مشروع التخرج",3]],
  "Information Systems": [["IS 110","Intro to Information Systems","مقدمة في نظم المعلومات",3],["CS 120","Programming I","البرمجة ١",3],["IS 210","Systems Analysis & Design","تحليل وتصميم النظم",3],["IS 230","Database Management","إدارة قواعد البيانات",3],["IS 250","Business Process Management","إدارة العمليات",3],["IS 310","Web Application Development","تطوير تطبيقات الويب",3],["IS 320","Networking & Security","الشبكات والأمن",3],["IS 330","Enterprise Systems (ERP)","أنظمة تخطيط الموارد",3],["IS 340","Data Analytics","تحليل البيانات",3],["IS 360","IT Project Management","إدارة مشاريع تقنية المعلومات",3],["IS 410","Information Security","أمن المعلومات",3],["IS 420","Cloud Computing","الحوسبة السحابية",3],["IS 450","Business Intelligence","ذكاء الأعمال",3],["IS 490","Capstone Project","مشروع التخرج",3]],
  "Electrical Engineering": [["EE 110","Intro to Electrical Eng.","مقدمة في الهندسة الكهربائية",3],["MATH 102","Calculus II","التفاضل والتكامل ٢",4],["PHYS 101","Physics I","الفيزياء ١",4],["EE 210","Circuit Analysis I","تحليل الدوائر ١",3],["EE 220","Circuit Analysis II","تحليل الدوائر ٢",3],["EE 240","Electronics I","الإلكترونيات ١",3],["EE 260","Electromagnetics","الكهرومغناطيسية",3],["EE 310","Signals & Systems","الإشارات والأنظمة",3],["EE 330","Power Systems","أنظمة القدرة",3],["EE 340","Control Systems","أنظمة التحكم",3],["EE 360","Communication Systems","أنظمة الاتصالات",3],["EE 410","Power Electronics","إلكترونيات القدرة",3],["EE 450","Electrical Machines","الآلات الكهربائية",3],["EE 490","Senior Project","مشروع التخرج",3]],
  "Mechanical Engineering": [["ME 110","Intro to Mechanical Eng.","مقدمة في الهندسة الميكانيكية",3],["PHYS 101","Physics I","الفيزياء ١",4],["ME 210","Statics","الاستاتيكا",3],["ME 220","Dynamics","الديناميكا",3],["ME 230","Thermodynamics I","الديناميكا الحرارية ١",3],["ME 240","Materials Science","علم المواد",3],["ME 260","Fluid Mechanics","ميكانيكا الموائع",3],["ME 310","Heat Transfer","انتقال الحرارة",3],["ME 320","Machine Design","تصميم الآلات",3],["ME 340","Manufacturing Processes","عمليات التصنيع",3],["ME 360","Mechanical Vibrations","الاهتزازات الميكانيكية",3],["ME 410","HVAC Systems","أنظمة التكييف",3],["ME 450","Control Systems","أنظمة التحكم",3],["ME 490","Senior Design","مشروع التخرج",3]],
  "Civil Engineering": [["CE 110","Intro to Civil Eng.","مقدمة في الهندسة المدنية",3],["PHYS 101","Physics I","الفيزياء ١",4],["CE 210","Statics","الاستاتيكا",3],["CE 220","Mechanics of Materials","مقاومة المواد",3],["CE 230","Surveying","المساحة",3],["CE 240","Fluid Mechanics","ميكانيكا الموائع",3],["CE 260","Construction Materials","مواد البناء",3],["CE 310","Structural Analysis","التحليل الإنشائي",3],["CE 320","Geotechnical Eng.","هندسة التربة",3],["CE 330","Transportation Eng.","هندسة النقل",3],["CE 340","Hydraulics","الهيدروليكا",3],["CE 360","Reinforced Concrete Design","تصميم الخرسانة المسلحة",3],["CE 410","Steel Design","تصميم المنشآت المعدنية",3],["CE 490","Senior Project","مشروع التخرج",3]],
  "Business Administration": [["BUS 100","Intro to Business","مقدمة في الأعمال",3],["ACCT 101","Financial Accounting","المحاسبة المالية",3],["ACCT 102","Managerial Accounting","المحاسبة الإدارية",3],["ECON 101","Microeconomics","الاقتصاد الجزئي",3],["ECON 102","Macroeconomics","الاقتصاد الكلي",3],["MGMT 200","Principles of Management","مبادئ الإدارة",3],["MKTG 200","Principles of Marketing","مبادئ التسويق",3],["FIN 200","Business Finance","تمويل الأعمال",3],["BUS 210","Business Statistics","إحصاء الأعمال",3],["BUS 220","Business Law","قانون الأعمال",3],["MGMT 310","Organizational Behavior","السلوك التنظيمي",3],["MGMT 330","Operations Management","إدارة العمليات",3],["MGMT 410","Strategic Management","الإدارة الاستراتيجية",3],["BUS 490","Capstone","مشروع التخرج",3]],
  "Accounting": [["ACCT 101","Financial Accounting I","المحاسبة المالية ١",3],["ACCT 102","Financial Accounting II","المحاسبة المالية ٢",3],["ACCT 201","Managerial Accounting","المحاسبة الإدارية",3],["ACCT 210","Intermediate Accounting I","المحاسبة المتوسطة ١",3],["ACCT 220","Intermediate Accounting II","المحاسبة المتوسطة ٢",3],["ACCT 310","Cost Accounting","محاسبة التكاليف",3],["ACCT 320","Auditing","التدقيق",3],["ACCT 330","Taxation","الضرائب",3],["ACCT 340","Accounting Information Systems","نظم المعلومات المحاسبية",3],["ACCT 410","Advanced Accounting","المحاسبة المتقدمة",3],["FIN 200","Corporate Finance","التمويل المؤسسي",3],["ECON 101","Microeconomics","الاقتصاد الجزئي",3],["BUS 220","Business Law","قانون الأعمال",3],["ACCT 490","Capstone","مشروع التخرج",3]],
  "Finance": [["FIN 200","Principles of Finance","مبادئ التمويل",3],["ACCT 101","Financial Accounting","المحاسبة المالية",3],["ECON 101","Microeconomics","الاقتصاد الجزئي",3],["ECON 102","Macroeconomics","الاقتصاد الكلي",3],["FIN 210","Corporate Finance","التمويل المؤسسي",3],["FIN 220","Financial Markets","الأسواق المالية",3],["FIN 310","Investments","الاستثمارات",3],["FIN 320","Financial Modeling","النمذجة المالية",3],["FIN 330","International Finance","التمويل الدولي",3],["FIN 340","Risk Management","إدارة المخاطر",3],["FIN 360","Portfolio Management","إدارة المحافظ",3],["FIN 410","Derivatives","المشتقات المالية",3],["BUS 210","Business Statistics","إحصاء الأعمال",3],["FIN 490","Capstone","مشروع التخرج",3]],
  "Marketing": [["MKTG 200","Principles of Marketing","مبادئ التسويق",3],["BUS 100","Intro to Business","مقدمة في الأعمال",3],["MKTG 210","Consumer Behavior","سلوك المستهلك",3],["MKTG 220","Marketing Research","بحوث التسويق",3],["MKTG 310","Digital Marketing","التسويق الرقمي",3],["MKTG 320","Brand Management","إدارة العلامة التجارية",3],["MKTG 330","Advertising & Promotion","الإعلان والترويج",3],["MKTG 340","Sales Management","إدارة المبيعات",3],["MKTG 360","Services Marketing","تسويق الخدمات",3],["MKTG 410","International Marketing","التسويق الدولي",3],["MKTG 420","Marketing Analytics","تحليلات التسويق",3],["ECON 101","Microeconomics","الاقتصاد الجزئي",3],["BUS 210","Business Statistics","إحصاء الأعمال",3],["MKTG 490","Capstone","مشروع التخرج",3]],
  "Architecture": [["ARCH 110","Architectural Design I","التصميم المعماري ١",4],["ARCH 120","Architectural Design II","التصميم المعماري ٢",4],["ARCH 130","Visual Communication","التواصل البصري",3],["ARCH 140","History of Architecture","تاريخ العمارة",3],["ARCH 210","Design Studio III","مرسم التصميم ٣",4],["ARCH 220","Building Construction","إنشاء المباني",3],["ARCH 230","Structures I","الإنشاءات ١",3],["ARCH 240","Environmental Systems","الأنظمة البيئية",3],["ARCH 310","Design Studio IV","مرسم التصميم ٤",4],["ARCH 330","Urban Design","التصميم الحضري",3],["ARCH 340","Sustainable Design","التصميم المستدام",3],["ARCH 410","Professional Practice","الممارسة المهنية",3],["ARCH 450","Thesis Studio","مرسم الأطروحة",4],["ARCH 490","Graduation Project","مشروع التخرج",4]],
  "Mathematics": [["MATH 101","Calculus I","التفاضل والتكامل ١",4],["MATH 102","Calculus II","التفاضل والتكامل ٢",4],["MATH 201","Calculus III","التفاضل والتكامل ٣",3],["MATH 210","Linear Algebra","الجبر الخطي",3],["MATH 220","Discrete Mathematics","الرياضيات المتقطعة",3],["MATH 230","Differential Equations","المعادلات التفاضلية",3],["MATH 310","Real Analysis I","التحليل الحقيقي ١",3],["MATH 320","Abstract Algebra","الجبر المجرد",3],["MATH 330","Probability Theory","نظرية الاحتمالات",3],["MATH 340","Numerical Analysis","التحليل العددي",3],["MATH 350","Complex Analysis","التحليل المركب",3],["MATH 410","Mathematical Statistics","الإحصاء الرياضي",3],["MATH 420","Partial Differential Equations","المعادلات التفاضلية الجزئية",3],["MATH 490","Senior Seminar","حلقة بحث التخرج",3]],
  "Biology": [["BIO 101","General Biology I","الأحياء العامة ١",4],["BIO 102","General Biology II","الأحياء العامة ٢",4],["CHEM 101","General Chemistry I","الكيمياء العامة ١",4],["BIO 210","Cell Biology","بيولوجيا الخلية",3],["BIO 220","Genetics","علم الوراثة",3],["BIO 230","Microbiology","علم الأحياء الدقيقة",3],["BIO 240","Ecology","علم البيئة",3],["BIO 310","Molecular Biology","البيولوجيا الجزيئية",3],["BIO 320","Physiology","علم وظائف الأعضاء",3],["BIO 330","Biochemistry","الكيمياء الحيوية",3],["BIO 340","Evolution","نظرية التطور",3],["BIO 410","Immunology","علم المناعة",3],["BIO 450","Biotechnology","التقنية الحيوية",3],["BIO 490","Senior Research","بحث التخرج",3]],
  "Chemistry": [["CHEM 101","General Chemistry I","الكيمياء العامة ١",4],["CHEM 102","General Chemistry II","الكيمياء العامة ٢",4],["CHEM 210","Organic Chemistry I","الكيمياء العضوية ١",3],["CHEM 220","Organic Chemistry II","الكيمياء العضوية ٢",3],["CHEM 230","Analytical Chemistry","الكيمياء التحليلية",3],["CHEM 240","Inorganic Chemistry","الكيمياء غير العضوية",3],["CHEM 310","Physical Chemistry I","الكيمياء الفيزيائية ١",3],["CHEM 320","Physical Chemistry II","الكيمياء الفيزيائية ٢",3],["CHEM 330","Biochemistry","الكيمياء الحيوية",3],["CHEM 340","Instrumental Analysis","التحليل الآلي",3],["CHEM 410","Spectroscopy","التحليل الطيفي",3],["MATH 101","Calculus I","التفاضل والتكامل ١",4],["CHEM 450","Research Methods","مناهج البحث",3],["CHEM 490","Senior Project","مشروع التخرج",3]],
  "Graphic Design": [["GD 110","Foundations of Design","أساسيات التصميم",3],["GD 120","Drawing & Composition","الرسم والتكوين",3],["GD 130","Typography I","فن الطباعة ١",3],["GD 140","Color Theory","نظرية الألوان",3],["GD 210","Digital Imaging","المعالجة الرقمية للصور",3],["GD 220","Typography II","فن الطباعة ٢",3],["GD 230","Branding & Identity","العلامة والهوية",3],["GD 240","Web Design","تصميم الويب",3],["GD 310","Motion Graphics","الرسوم المتحركة",3],["GD 320","UX/UI Design","تصميم تجربة المستخدم",3],["GD 330","Packaging Design","تصميم التغليف",3],["GD 340","Illustration","الرسم التوضيحي",3],["GD 410","Portfolio Development","إعداد ملف الأعمال",3],["GD 490","Graduation Project","مشروع التخرج",3]],
  "Nursing": [["NURS 101","Foundations of Nursing","أساسيات التمريض",4],["BIO 110","Anatomy & Physiology I","التشريح ووظائف الأعضاء ١",4],["BIO 120","Anatomy & Physiology II","التشريح ووظائف الأعضاء ٢",4],["NURS 210","Health Assessment","التقييم الصحي",3],["NURS 220","Pharmacology","علم الأدوية",3],["NURS 230","Adult Health Nursing I","تمريض صحة البالغين ١",4],["NURS 240","Microbiology for Nurses","الأحياء الدقيقة للتمريض",3],["NURS 310","Adult Health Nursing II","تمريض صحة البالغين ٢",4],["NURS 320","Maternal & Child Health","صحة الأم والطفل",4],["NURS 330","Mental Health Nursing","تمريض الصحة النفسية",3],["NURS 340","Community Health Nursing","تمريض صحة المجتمع",3],["NURS 410","Critical Care Nursing","تمريض العناية الحرجة",4],["NURS 450","Nursing Research","بحوث التمريض",3],["NURS 490","Clinical Practicum","التدريب السريري",4]],
  "Law": [["LAW 101","Intro to Law","مقدمة في القانون",3],["LAW 110","Constitutional Law","القانون الدستوري",3],["LAW 120","Legal Writing","الصياغة القانونية",3],["LAW 210","Contract Law","قانون العقود",3],["LAW 220","Criminal Law","القانون الجنائي",3],["LAW 230","Civil Procedure","أصول المحاكمات المدنية",3],["LAW 240","Property Law","قانون الملكية",3],["LAW 310","Tort Law","قانون المسؤولية",3],["LAW 320","Commercial Law","القانون التجاري",3],["LAW 330","International Law","القانون الدولي",3],["LAW 410","Labor Law","قانون العمل",3],["LAW 420","Islamic Jurisprudence","الفقه الإسلامي",3],["LAW 450","Moot Court","المحكمة الصورية",3],["LAW 490","Graduation Research","بحث التخرج",3]],
  "English Literature": [["ENGL 101","Intro to Literature","مقدمة في الأدب",3],["ENGL 110","Academic Writing","الكتابة الأكاديمية",3],["ENGL 120","World Literature","الأدب العالمي",3],["ENGL 210","British Literature I","الأدب البريطاني ١",3],["ENGL 220","British Literature II","الأدب البريطاني ٢",3],["ENGL 230","American Literature","الأدب الأمريكي",3],["ENGL 240","Literary Criticism","النقد الأدبي",3],["ENGL 310","Shakespeare","شكسبير",3],["ENGL 320","The Novel","الرواية",3],["ENGL 330","Poetry & Poetics","الشعر ونظرياته",3],["ENGL 340","Drama","الدراما",3],["ENGL 410","Modern Literature","الأدب الحديث",3],["ENGL 420","Linguistics","علم اللغة",3],["ENGL 490","Senior Thesis","أطروحة التخرج",3]],
};

export const GEN_ED: CourseTuple[] = [["ENGL 110","English Composition","الكتابة بالإنجليزية",3],["ENGL 120","Technical Writing","الكتابة التقنية",3],["MATH 101","Calculus I","التفاضل والتكامل ١",4],["ARAB 100","Arabic Language","اللغة العربية",3],["ISLM 100","Islamic Culture","الثقافة الإسلامية",3],["HIST 120","Gulf & Kuwait History","تاريخ الخليج والكويت",2],["PHIL 200","Critical Thinking","التفكير الناقد",3],["ELEC 200","Free Elective","مادة حرة",3]];

export const DEMO_DONE = ["CS 120","CS 140","CS 199","CS 220","CS 240","CS 280","CS 300","ENGL 110","ENGL 120","MATH 101","ARAB 100","ISLM 100","PHYS 101","PHIL 200"];

export const GP: Record<string, number> = { "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0 };
export const GRADE_OPTS = ["A","A-","B+","B","B-","C+","C","C-","D+","D","F"];

const PREF_MAP: Record<string, [string, string]> = { CS:["Computer Science","علوم الحاسوب"], CPE:["Computer Engineering","هندسة الحاسوب"], EE:["Electrical Eng.","الهندسة الكهربائية"], ME:["Mechanical Eng.","الهندسة الميكانيكية"], CE:["Civil Eng.","الهندسة المدنية"], IS:["Information Systems","نظم المعلومات"], MATH:["Mathematics","الرياضيات"], STAT:["Statistics","الإحصاء"], PHYS:["Physics","الفيزياء"], CHEM:["Chemistry","الكيمياء"], BIO:["Biology","الأحياء"], ENGL:["English","اللغة الإنجليزية"], ARAB:["Arabic","اللغة العربية"], ISLM:["Islamic Studies","الدراسات الإسلامية"], HIST:["History","التاريخ"], PHIL:["Philosophy","الفلسفة"], ELEC:["Free Electives","مواد حرة"], BUS:["Business","الأعمال"], ACCT:["Accounting","المحاسبة"], FIN:["Finance","التمويل"], MKTG:["Marketing","التسويق"], MGMT:["Management","الإدارة"], ECON:["Economics","الاقتصاد"], ARCH:["Architecture","العمارة"], GD:["Design","التصميم"], NURS:["Nursing","التمريض"], LAW:["Law","القانون"] };

const CAT_COLORS = ["#2C6E91","#1E8378","#7A5AA8","#C2566A","#B5762E","#5B8C5A","#3E7CB1"];

export function coursesForMajor(major: string): CourseTuple[] {
  return MAJOR_COURSES[major] || MAJOR_COURSES["Computer Science"];
}

export function planForMajor(major: string): CourseTuple[] {
  const out: CourseTuple[] = [];
  const seen: Record<string, number> = {};
  [...coursesForMajor(major), ...GEN_ED].forEach((c) => {
    if (!seen[c[0]]) { seen[c[0]] = 1; out.push(c); }
  });
  return out;
}

export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

// offset 0 = Fall 2026 (anchor)
export function termAt(offset: number) {
  const si = ((offset % 3) + 3) % 3; // 0 Fall, 1 Spring, 2 Summer
  const oFall = offset - si;
  const fallYear = 2026 + oFall / 3;
  const year = si === 0 ? fallYear : fallYear + 1;
  const seasonKey = (["fall", "spring", "summer"] as const)[si];
  const en = ({ fall: "Fall", spring: "Spring", summer: "Summer" })[seasonKey] + " " + year;
  const ar = ({ fall: "خريف", spring: "ربيع", summer: "صيف" })[seasonKey] + " " + toArabicDigits(year);
  return { seasonKey, en, ar };
}

export type SemesterVM = {
  term: string; credits: number; courses: { code: string; cr: number }[];
  isDone: boolean; status: "done" | "next" | "planned"; statusLabel: string;
  summer: boolean; next: boolean;
};

export type PlanResult = {
  reqCredits: number; doneCredits: number; remainingCredits: number; pct: number;
  semesters: SemesterVM[]; semestersLeft: number; gradTerm: string;
  categories: { label: string; done: number; req: number; color: string; pctWidth: number }[];
  paceLabel: string; planLen: number; doneLen: number;
};

// Resolve the course list that drives the plan: the student's uploaded program
// courses when available, otherwise the catalog for their major.
export type ProgramCourse = { code: string; title: string; credits: number };
export function resolvePlanCourses(programCourses: ProgramCourse[] | undefined, major: string): CourseTuple[] {
  if (programCourses && programCourses.length) {
    return programCourses.map((c) => [c.code, c.title, c.title, c.credits] as CourseTuple);
  }
  return planForMajor(major);
}

// ---- official program requirements (per university regulations) ----
const ENGINEERING_MAJORS = new Set(["Computer Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"]);
const BUSINESS_MAJORS = new Set(["Business Administration", "Accounting", "Finance", "Marketing"]);
export const GRAD_MIN_GPA = 2.0;
export const ADVANCED_MIN_CREDITS = 45; // ≥45 credits from Advanced Level (300+)

export function collegeMinCredits(major: string): number {
  if (ENGINEERING_MAJORS.has(major)) return 144; // College of Engineering
  if (BUSINESS_MAJORS.has(major)) return 126;     // College of Business Administration
  return 120;                                     // College of Arts / default
}

// The real total to graduate: the uploaded sheet's credits if available, else the college minimum.
export function programTotalCredits(major: string, programCourses?: { credits: number }[]): number {
  if (programCourses && programCourses.length) {
    const sum = programCourses.reduce((a, c) => a + c.credits, 0);
    if (sum > 0) return sum;
  }
  return collegeMinCredits(major);
}

// Credits earned from Advanced-Level (course number ≥ 300) completed courses.
export function advancedCredits(completed: Set<string>, planCourses: CourseTuple[]): number {
  let cr = 0;
  for (const code of completed) {
    const num = parseInt((code.match(/\d{3}/) || ["0"])[0], 10);
    if (num >= 300) {
      const tup = planCourses.find((c) => c[0] === code);
      cr += tup ? tup[3] : 3;
    }
  }
  return cr;
}

export function computePlan(
  planCourses: CourseTuple[],
  completed: Set<string>,
  lang: Lang,
  t: Dict,
  totalCredits?: number
): PlanResult {
  const plan = planCourses;
  const done = plan.filter((c) => completed.has(c[0]));
  const rem = plan.filter((c) => !completed.has(c[0]));
  const reqCredits = totalCredits ?? plan.reduce((a, c) => a + c[3], 0);
  // count ALL completed credits (even completed courses outside the known list)
  const doneCredits = [...completed].reduce((a, code) => {
    const tup = plan.find((c) => c[0] === code);
    return a + (tup ? tup[3] : 3);
  }, 0);
  const remainingCredits = Math.max(0, reqCredits - doneCredits);
  const pct = reqCredits ? Math.min(100, Math.round((doneCredits / reqCredits) * 100)) : 0;
  const capFor = (k: string) => (k === "summer" ? 2 : 5);

  // past terms (completed), ending just before Fall 2026
  const pastOffsets: number[] = [];
  let cap = 0, o = -1, guard = 0;
  while (cap < done.length && guard++ < 60) { cap += capFor(termAt(o).seasonKey); pastOffsets.push(o); o--; }
  pastOffsets.reverse();

  const termsMap: { offset: number; courses: CourseTuple[]; status: "done" | "next" | "planned" }[] = [];
  let di = 0;
  for (const off of pastOffsets) {
    const c = capFor(termAt(off).seasonKey);
    const slice = done.slice(di, di + c); di += slice.length;
    if (slice.length) termsMap.push({ offset: off, courses: slice, status: "done" });
  }

  // future terms: first the known remaining courses, then planned terms (~15 cr,
  // fall/spring only) until the full required total is scheduled.
  let ri = 0, firstFuture = true; o = 0; guard = 0;
  let scheduled = doneCredits;
  while (ri < rem.length && guard++ < 60) {
    const c = capFor(termAt(o).seasonKey);
    const slice = rem.slice(ri, ri + c); ri += slice.length;
    if (slice.length) {
      termsMap.push({ offset: o, courses: slice, status: firstFuture ? "next" : "planned" });
      firstFuture = false;
      scheduled += slice.reduce((a, cc) => a + cc[3], 0);
    }
    o++;
  }
  guard = 0;
  while (scheduled < reqCredits && guard++ < 40) {
    const season = termAt(o).seasonKey;
    if (season === "summer") { o++; continue; } // students rarely fill summers
    const add = Math.min(15, reqCredits - scheduled);
    termsMap.push({ offset: o, courses: [["__REM__", "Remaining requirements", "متطلبات متبقية", add] as CourseTuple], status: firstFuture ? "next" : "planned" });
    firstFuture = false;
    scheduled += add;
    o++;
  }
  termsMap.sort((a, b) => a.offset - b.offset);

  const semesters: SemesterVM[] = termsMap.map((tm) => {
    const info = termAt(tm.offset);
    const isDone = tm.status === "done", next = tm.status === "next", summer = info.seasonKey === "summer";
    return {
      term: lang === "ar" ? info.ar : info.en,
      credits: tm.courses.reduce((a, c) => a + c[3], 0),
      courses: tm.courses.map((c) => ({ code: c[0], cr: c[3] })),
      isDone, status: tm.status,
      statusLabel: isDone ? t.lgCompleted : next ? t.lgUpNext : t.lgPlanned,
      summer, next,
    };
  });

  const futureTerms = termsMap.filter((tm) => tm.status !== "done");
  const semestersLeft = futureTerms.length;
  const lastTerm = termsMap[termsMap.length - 1];
  const gradTerm = remainingCredits <= 0
    ? (lang === "ar" ? "مكتمل" : "Done")
    : (lastTerm ? termAt(lastTerm.offset)[lang === "ar" ? "ar" : "en"] : "—");

  // requirement categories by course prefix
  const groups: Record<string, { req: number; done: number }> = {};
  plan.forEach((c) => {
    const p = c[0].split(" ")[0];
    if (!groups[p]) groups[p] = { req: 0, done: 0 };
    groups[p].req += c[3];
    if (completed.has(c[0])) groups[p].done += c[3];
  });
  const categories = Object.keys(groups)
    .map((p) => ({ p, ...groups[p] }))
    .sort((a, b) => b.req - a.req)
    .slice(0, 6)
    .map((g, i) => ({
      label: PREF_MAP[g.p] ? PREF_MAP[g.p][lang === "ar" ? 1 : 0] : g.p,
      done: g.done, req: g.req, color: CAT_COLORS[i % CAT_COLORS.length],
      pctWidth: Math.round((g.done / g.req) * 100),
    }));

  const paceLabel = lang === "ar" ? "٥ مواد/فصل" : "5 courses/term";
  return { reqCredits, doneCredits, remainingCredits, pct, semesters, semestersLeft, gradTerm, categories, paceLabel, planLen: plan.length, doneLen: done.length };
}

// ---- GPA ----
export type GradeRow = { code: string; en: string; ar: string; cr: number; term: string; termAr: string; g: string };

export const GRADED_COURSES: GradeRow[] = [
  { code: "ENGL 110", en: "English Composition I", ar: "الكتابة بالإنجليزية ١", cr: 3, term: "Fall 2023", termAr: "خريف ٢٠٢٣", g: "A-" },
  { code: "MATH 101", en: "Calculus I", ar: "التفاضل والتكامل ١", cr: 4, term: "Fall 2023", termAr: "خريف ٢٠٢٣", g: "B+" },
  { code: "CS 120", en: "Intro to Programming", ar: "مقدمة في البرمجة", cr: 3, term: "Fall 2023", termAr: "خريف ٢٠٢٣", g: "A" },
  { code: "ARAB 100", en: "Arabic Language", ar: "اللغة العربية", cr: 3, term: "Fall 2023", termAr: "خريف ٢٠٢٣", g: "A" },
  { code: "MATH 102", en: "Calculus II", ar: "التفاضل والتكامل ٢", cr: 4, term: "Spring 2024", termAr: "ربيع ٢٠٢٤", g: "B" },
  { code: "CS 140", en: "Data Structures", ar: "هياكل البيانات", cr: 3, term: "Spring 2024", termAr: "ربيع ٢٠٢٤", g: "A-" },
  { code: "PHYS 101", en: "General Physics I", ar: "الفيزياء العامة ١", cr: 3, term: "Spring 2024", termAr: "ربيع ٢٠٢٤", g: "B+" },
  { code: "CS 199", en: "Discrete Mathematics", ar: "الرياضيات المتقطعة", cr: 3, term: "Summer 2024", termAr: "صيف ٢٠٢٤", g: "A" },
  { code: "CS 220", en: "Computer Organization", ar: "تنظيم الحاسوب", cr: 3, term: "Fall 2024", termAr: "خريف ٢٠٢٤", g: "A-" },
  { code: "CS 240", en: "Object-Oriented Prog.", ar: "البرمجة الكائنية", cr: 3, term: "Spring 2025", termAr: "ربيع ٢٠٢٥", g: "A" },
  { code: "PHIL 200", en: "Critical Thinking", ar: "التفكير الناقد", cr: 3, term: "Fall 2025", termAr: "خريف ٢٠٢٥", g: "A" },
  { code: "CS 280", en: "Software Engineering", ar: "هندسة البرمجيات", cr: 3, term: "Fall 2025", termAr: "خريف ٢٠٢٥", g: "A-" },
  { code: "CS 300", en: "Theory of Computation", ar: "نظرية الحوسبة", cr: 3, term: "Fall 2025", termAr: "خريف ٢٠٢٥", g: "B" },
  { code: "ENGL 120", en: "Technical Writing", ar: "الإنجليزية التقنية", cr: 3, term: "Spring 2025", termAr: "ربيع ٢٠٢٥", g: "A-" },
  { code: "ISLM 100", en: "Islamic Culture", ar: "الثقافة الإسلامية", cr: 3, term: "Spring 2024", termAr: "ربيع ٢٠٢٤", g: "A" },
];

// Legacy demo-list GPA (kept for reference / fallback).
export function computeGPA(overrides: Record<string, string>) {
  return computeGpaFrom(
    GRADED_COURSES.map((c) => ({ code: c.code, credits: c.cr })),
    Object.fromEntries(GRADED_COURSES.map((c) => [c.code, overrides[c.code] ?? c.g]))
  );
}

// Real GPA: weighted average over only the courses that have a valid letter grade.
export function computeGpaFrom(
  courses: { code: string; credits: number }[],
  grades: Record<string, string>
) {
  let pts = 0, cr = 0, gradedCount = 0;
  for (const c of courses) {
    const g = grades[c.code];
    const gp = g != null ? GP[g] : undefined;
    if (gp == null) continue;
    pts += gp * c.credits; cr += c.credits; gradedCount++;
  }
  return { gpa: cr ? pts / cr : 0, credits: cr, points: pts, gradedCount };
}

// Build the gradeable list = the student's completed courses (with title/credits
// resolved from their plan) merged with any grades they've already recorded.
export type GradeListItem = { code: string; title: string; credits: number; term: string };
export function buildGradeList(
  completed: Set<string>,
  planCourses: CourseTuple[],
  gradeRows: { code: string; title: string | null; credits: number; term: string | null }[]
): GradeListItem[] {
  // Only the courses the student has actually taken (marked completed).
  const byCode = new Map<string, GradeListItem>();
  const lookup = new Map(planCourses.map((c) => [c[0], c]));
  for (const code of completed) {
    const t = lookup.get(code);
    byCode.set(code, { code, title: t ? t[1] : code, credits: t ? t[3] : 3, term: "" });
  }
  // Use saved grade rows ONLY to enrich (title/credits/term) the taken courses — never to add others.
  for (const r of gradeRows) {
    const existing = byCode.get(r.code);
    if (!existing) continue;
    byCode.set(r.code, {
      code: r.code,
      title: r.title || existing.title,
      credits: r.credits || existing.credits,
      term: r.term || existing.term,
    });
  }
  // stable order by course code
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

// Real pacing: compare credits done against what a student should have by now,
// given their cohort (entry) year and a standard 4-year program.
export type PaceStatus = "new" | "ahead" | "ontrack" | "slightly" | "behind";
export type PaceResult = {
  status: PaceStatus;
  expectedCredits: number;   // credits they "should" have by now
  perYear: number;           // expected credits/year for this program
  yearsEnrolled: number;
  actualPerYear: number;     // their real pace
};
export function computePace(
  cohort: string | null | undefined,
  doneCredits: number,
  reqCredits: number,
  now: Date
): PaceResult {
  const entryYear = parseInt(cohort || "", 10) || now.getFullYear() - 1;
  // Assume enrolment starts in the Fall (≈ August) of the cohort year.
  const entry = new Date(entryYear, 7, 1);
  const yearsEnrolled = Math.max(0, (now.getTime() - entry.getTime()) / (365.25 * 24 * 3600 * 1000));
  const perYear = reqCredits / 4; // standard 4-year bachelor pace
  const expectedCredits = Math.min(reqCredits, yearsEnrolled * perYear);
  const actualPerYear = yearsEnrolled > 0.1 ? doneCredits / yearsEnrolled : doneCredits;

  // Just enrolled — not enough time to judge.
  if (expectedCredits < perYear * 0.3) {
    return { status: "new", expectedCredits, perYear, yearsEnrolled, actualPerYear };
  }
  const ratio = expectedCredits > 0 ? doneCredits / expectedCredits : 1;
  let status: PaceStatus;
  if (ratio >= 1.1) status = "ahead";
  else if (ratio >= 0.85) status = "ontrack";
  else if (ratio >= 0.6) status = "slightly";
  else status = "behind";
  return { status, expectedCredits, perYear, yearsEnrolled, actualPerYear };
}

export function fmtDue(d: string, lang: Lang): string {
  if (!d) return "";
  const parts = String(d).split("-");
  if (parts.length !== 3) return d;
  const mEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mAr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const mi = parseInt(parts[1], 10) - 1;
  return (lang === "ar" ? mAr[mi] : mEn[mi]) + " " + parseInt(parts[2], 10);
}

// Friendly, colorful breakdown of a course list grouped by subject area —
// turns a dull sheet into an at-a-glance, encouraging summary.
const DEPT_META: Record<string, { en: string; ar: string; color: string; icon: string }> = {
  CS: { en: "Computer Science", ar: "علوم الحاسوب", color: "#2C6E91", icon: "code" },
  CPE: { en: "Computer Eng.", ar: "هندسة الحاسوب", color: "#2C6E91", icon: "memory" },
  IS: { en: "Information Systems", ar: "نظم المعلومات", color: "#2C6E91", icon: "dns" },
  MIS: { en: "Information Systems", ar: "نظم المعلومات", color: "#2C6E91", icon: "dns" },
  EE: { en: "Electrical Eng.", ar: "الهندسة الكهربائية", color: "#B5762E", icon: "bolt" },
  ME: { en: "Mechanical Eng.", ar: "الهندسة الميكانيكية", color: "#B5762E", icon: "settings" },
  CE: { en: "Civil Eng.", ar: "الهندسة المدنية", color: "#B5762E", icon: "foundation" },
  MATH: { en: "Mathematics", ar: "الرياضيات", color: "#7A5AA8", icon: "functions" },
  STAT: { en: "Statistics", ar: "الإحصاء", color: "#7A5AA8", icon: "bar_chart" },
  PHYS: { en: "Physics", ar: "الفيزياء", color: "#5B8C5A", icon: "science" },
  CHEM: { en: "Chemistry", ar: "الكيمياء", color: "#5B8C5A", icon: "science" },
  BIO: { en: "Biology", ar: "الأحياء", color: "#5B8C5A", icon: "biotech" },
  ENGL: { en: "English", ar: "اللغة الإنجليزية", color: "#1E8378", icon: "menu_book" },
  ARAB: { en: "Arabic", ar: "اللغة العربية", color: "#1E8378", icon: "translate" },
  ISLM: { en: "Islamic Studies", ar: "الدراسات الإسلامية", color: "#156B61", icon: "mosque" },
  HIST: { en: "History", ar: "التاريخ", color: "#B5762E", icon: "history_edu" },
  PHIL: { en: "Philosophy", ar: "الفلسفة", color: "#7A5AA8", icon: "psychology" },
  BUS: { en: "Business", ar: "الأعمال", color: "#2C6E91", icon: "business_center" },
  ACCT: { en: "Accounting", ar: "المحاسبة", color: "#2C6E91", icon: "calculate" },
  FIN: { en: "Finance", ar: "التمويل", color: "#2C6E91", icon: "payments" },
  MKTG: { en: "Marketing", ar: "التسويق", color: "#C2566A", icon: "campaign" },
  MGMT: { en: "Management", ar: "الإدارة", color: "#2C6E91", icon: "groups" },
  ECON: { en: "Economics", ar: "الاقتصاد", color: "#2C6E91", icon: "trending_up" },
  ARCH: { en: "Architecture", ar: "العمارة", color: "#B5762E", icon: "architecture" },
  GD: { en: "Design", ar: "التصميم", color: "#C2566A", icon: "brush" },
  NURS: { en: "Nursing", ar: "التمريض", color: "#C2566A", icon: "health_and_safety" },
  LAW: { en: "Law", ar: "القانون", color: "#102A40", icon: "gavel" },
  ELEC: { en: "Electives", ar: "مواد حرة", color: "#6BA6CF", icon: "auto_awesome" },
  FREE: { en: "Electives", ar: "مواد حرة", color: "#6BA6CF", icon: "auto_awesome" },
  HUM: { en: "Humanities", ar: "العلوم الإنسانية", color: "#7A5AA8", icon: "palette" },
};

export type DeptGroup = { prefix: string; label: string; color: string; icon: string; count: number; credits: number };
export function departmentBreakdown(courses: { code: string; credits: number }[], lang: Lang): DeptGroup[] {
  const groups: Record<string, { count: number; credits: number }> = {};
  for (const c of courses) {
    const p = c.code.split(" ")[0];
    if (!groups[p]) groups[p] = { count: 0, credits: 0 };
    groups[p].count++;
    groups[p].credits += c.credits;
  }
  return Object.keys(groups)
    .map((p) => {
      const meta = DEPT_META[p] || { en: p, ar: p, color: "#6E7C86", icon: "school" };
      return { prefix: p, label: lang === "ar" ? meta.ar : meta.en, color: meta.color, icon: meta.icon, count: groups[p].count, credits: groups[p].credits };
    })
    .sort((a, b) => b.credits - a.credits);
}

// ===== Journey map: turn the plan into a game-like quest of stages =====
// Prerequisite proxy: a course unlocks once all LOWER-numbered courses in the
// same department are completed (100→200→300→400), with the degree as the treasure.
export type JourneyState = "done" | "available" | "locked";
export type JourneyNode = { code: string; title: string; credits: number; num: number; level: number; state: JourneyState; needs?: string };
export type JourneyStage = { level: number; courses: JourneyNode[] };

export function buildJourney(planCourses: CourseTuple[], completed: Set<string>): JourneyStage[] {
  const numOf = (code: string) => { const m = code.match(/(\d{3})/); return m ? parseInt(m[1], 10) : 100; };
  const base = planCourses.map((c) => {
    const dept = c[0].split(" ")[0];
    const num = numOf(c[0]);
    return { code: c[0], title: c[1], credits: c[3], dept, num, level: Math.min(4, Math.max(1, Math.floor(num / 100))) };
  });

  const prereqMet = (n: { dept: string; num: number }) =>
    base.every((m) => !(m.dept === n.dept && m.num < n.num && !completed.has(m.code)));
  const blockerOf = (n: { dept: string; num: number }) => {
    let blk: { code: string; num: number } | null = null;
    for (const m of base) if (m.dept === n.dept && m.num < n.num && !completed.has(m.code) && (!blk || m.num > blk.num)) blk = m;
    return blk?.code;
  };

  const nodes: JourneyNode[] = base.map((n) => {
    if (completed.has(n.code)) return { code: n.code, title: n.title, credits: n.credits, num: n.num, level: n.level, state: "done" };
    if (prereqMet(n)) return { code: n.code, title: n.title, credits: n.credits, num: n.num, level: n.level, state: "available" };
    return { code: n.code, title: n.title, credits: n.credits, num: n.num, level: n.level, state: "locked", needs: blockerOf(n) };
  });

  const stages: JourneyStage[] = [];
  for (const lvl of [1, 2, 3, 4]) {
    const cs = nodes.filter((n) => n.level === lvl).sort((a, b) => a.num - b.num || a.code.localeCompare(b.code));
    if (cs.length) stages.push({ level: lvl, courses: cs });
  }
  return stages;
}

export function initialsOf(name: string): string {
  return (
    name.split(" ").filter((w) => w.length > 1).slice(0, 2).map((w) => w[0].toUpperCase()).join("") ||
    name.slice(0, 2).toUpperCase()
  );
}

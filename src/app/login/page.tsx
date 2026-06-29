"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n, langSwitchLabel } from "@/lib/i18n";
import { Icon, Logo, useIsMobile } from "@/components/ui";

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid var(--border)", borderRadius: 11, padding: "12px 14px",
  fontSize: 14, outline: "none", color: "var(--text)", background: "var(--surface)",
};
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6, display: "block" };

export default function LoginPage() {
  const { t, lang, toggleLang } = useI18n();
  const { user, profile, loading, signIn, signUp, loginDemo } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // login fields
  const [email, setEmail] = useState("layla.m@coded.edu.kw");
  const [password, setPassword] = useState("password123");
  // signup fields
  const [suUser, setSuUser] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suPw2, setSuPw2] = useState("");

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(profile && !profile.onboarded ? "/onboarding" : "/dashboard");
  }, [user, profile, loading, router]);

  const msg = (en: string, ar: string) => (lang === "ar" ? ar : en);

  async function doLogin() {
    setError("");
    if (!email || !password) return setError(msg("Enter your email and password.", "أدخل بريدك وكلمة المرور."));
    setBusy(true);
    const r = await signIn(email, password);
    setBusy(false);
    if (r.error) setError(msg("No account matches those details.", "لا يوجد حساب مطابق لهذه البيانات."));
  }

  async function doDemo() {
    setError("");
    setBusy(true);
    const r = await loginDemo();
    setBusy(false);
    if (r.error) setError(msg("Demo account unavailable.", "الحساب التجريبي غير متاح."));
  }

  async function doSignup() {
    setError("");
    if (!suUser || !suPhone || !suEmail || !suPw || !suPw2) return setError(msg("Please fill in every field.", "يرجى تعبئة جميع الحقول."));
    if (!/^\S+@\S+\.\S+$/.test(suEmail)) return setError(msg("Enter a valid email address.", "أدخل بريداً إلكترونياً صحيحاً."));
    if (suPhone.replace(/\D/g, "").length < 8) return setError(msg("Enter a valid phone number.", "أدخل رقم هاتف صحيحاً."));
    if (suPw.length < 6) return setError(msg("Password must be at least 6 characters.", "كلمة المرور يجب ألا تقل عن ٦ أحرف."));
    if (suPw !== suPw2) return setError(msg("Passwords don't match.", "كلمتا المرور غير متطابقتين."));
    setBusy(true);
    const r = await signUp({ username: suUser, phone: suPhone, email: suEmail, password: suPw });
    setBusy(false);
    if (r.error === "CONFIRM_EMAIL")
      setError(msg("Account created — check your email to confirm, then sign in.", "تم إنشاء الحساب — أكّد بريدك ثم سجّل الدخول."));
    else if (r.error) setError(r.error);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: "var(--bg)" }}>
      {/* brand panel */}
      {!isMobile && (
        <div style={{ width: "44%", maxWidth: 540, background: "#102A40", color: "#fff", padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Logo size={40} radius={11} textSize={19} light />
          <div>
            <div className="serif" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.14 }}>{t.tagline}</div>
            <div style={{ fontSize: 14.5, color: "#9fb3c2", marginTop: 14, lineHeight: 1.65, maxWidth: 380 }}>{t.authPitch}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 30 }}>
              {[t.feat1, t.feat2, t.feat3].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 14, color: "#dce6ed" }}>
                  <Icon name="check_circle" size={21} color="#6BD3A8" />{f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6f8497" }}>Kuwait · الكويت</div>
        </div>
      )}

      {/* form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 404 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            {isMobile ? <Logo size={34} radius={9} textSize={16} /> : <span />}
            <button onClick={toggleLang} style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "7px 11px", color: "var(--text)", fontWeight: 600, fontSize: 12.5 }}>
              <Icon name="translate" size={17} />{langSwitchLabel(lang)}
            </button>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FBECEC", border: "1px solid #E7CFCF", color: "#B5564E", borderRadius: 10, padding: "10px 13px", fontSize: 13, marginBottom: 16 }}>
              <Icon name="error" size={18} />{error}
            </div>
          )}

          {mode === "login" ? (
            <div className="fade-up">
              <div className="serif" style={{ fontSize: 29, fontWeight: 600, color: "var(--ink-strong)" }}>{t.welcomeBack}</div>
              <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 5, marginBottom: 22 }}>{t.loginSub}</div>

              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>{t.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>{t.password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} style={inputStyle} />
              </div>
              <button onClick={doLogin} disabled={busy} style={{ width: "100%", background: "#102A40", color: "#fff", border: "none", borderRadius: 11, padding: 13, fontWeight: 600, fontSize: 14.5, opacity: busy ? 0.7 : 1 }}>{t.signIn}</button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{t.demoHint}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <button onClick={doDemo} disabled={busy} style={{ width: "100%", background: "var(--surface)", color: "var(--ink-strong)", border: "1px solid var(--border)", borderRadius: 11, padding: 12, fontWeight: 600, fontSize: 14 }}>{t.useDemo}</button>

              <div style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "var(--muted)" }}>
                {t.noAccount}{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: "#1E8378", fontWeight: 700, fontSize: 13.5, padding: 0 }}>{t.signUp}</button>
              </div>
            </div>
          ) : (
            <div className="fade-up">
              <div className="serif" style={{ fontSize: 29, fontWeight: 600, color: "var(--ink-strong)" }}>{t.createAccount}</div>
              <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 5, marginBottom: 22 }}>{t.signupSub}</div>

              <div style={{ marginBottom: 13 }}>
                <label style={labelStyle}>{t.username}</label>
                <input value={suUser} onChange={(e) => setSuUser(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={labelStyle}>{t.phone}</label>
                <input type="tel" placeholder="+965" value={suPhone} onChange={(e) => setSuPhone(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={labelStyle}>{t.email}</label>
                <input type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>{t.password}</label>
                  <input type="password" value={suPw} onChange={(e) => setSuPw(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>{t.confirmPassword}</label>
                  <input type="password" value={suPw2} onChange={(e) => setSuPw2(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <button onClick={doSignup} disabled={busy} style={{ width: "100%", background: "#102A40", color: "#fff", border: "none", borderRadius: 11, padding: 13, fontWeight: 600, fontSize: 14.5, opacity: busy ? 0.7 : 1 }}>{t.signUp}</button>

              <div style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "var(--muted)" }}>
                {t.haveAccount}{" "}
                <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "#1E8378", fontWeight: 700, fontSize: 13.5, padding: 0 }}>{t.signIn}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/ui";

export default function Home() {
  const { loading, user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (profile && !profile.onboarded) router.replace("/onboarding");
    else router.replace("/dashboard");
  }, [loading, user, profile, router]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "var(--sand)",
      }}
    >
      <Logo size={48} radius={14} textSize={22} />
      <div
        className="spin"
        style={{
          width: 30,
          height: 30,
          border: "3px solid #E6F2EF",
          borderTopColor: "#1E8378",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

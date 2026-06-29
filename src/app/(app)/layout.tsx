"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DataProvider } from "@/lib/data";
import AppShell from "@/components/AppShell";
import { Logo } from "@/components/ui";

function Splash() {
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, background: "var(--sand)" }}>
      <Logo size={48} radius={14} textSize={22} />
      <div className="spin" style={{ width: 30, height: 30, border: "3px solid #E6F2EF", borderTopColor: "#1E8378", borderRadius: "50%" }} />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (profile && !profile.onboarded) router.replace("/onboarding");
  }, [loading, user, profile, router]);

  if (loading || !user || (profile && !profile.onboarded)) return <Splash />;

  return (
    <DataProvider>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}

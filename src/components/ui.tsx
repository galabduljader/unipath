"use client";

import { useEffect, useState } from "react";

export function Icon({
  name,
  size = 20,
  color,
  className,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={"msym" + (className ? " " + className : "")}
      style={{ fontSize: size, color, ...style }}
    >
      {name}
    </span>
  );
}

// Mobile breakpoint matches the mockup (vw < 900).
export function useIsMobile(bp = 900) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const on = () => setMobile(window.innerWidth < bp);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return mobile;
}

// The UNI PATH diamond logo mark.
export function Logo({
  size = 36,
  radius = 10,
  text = true,
  textSize = 17,
  light = false,
}: {
  size?: number;
  radius?: number;
  text?: boolean;
  textSize?: number;
  light?: boolean;
}) {
  const inner = Math.round(size * 0.36);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: "#1E8378",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: inner, height: inner, background: "#fff", transform: "rotate(45deg)", borderRadius: 2 }} />
      </div>
      {text && (
        <div style={{ fontWeight: 700, fontSize: textSize, letterSpacing: ".04em", color: light ? "#fff" : "#102A40" }}>
          UNI<span style={{ color: light ? "#6BA6CF" : "#1E8378" }}>PATH</span>
        </div>
      )}
    </div>
  );
}

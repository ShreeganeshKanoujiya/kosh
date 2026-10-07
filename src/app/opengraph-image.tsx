import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// The preview shown when a Kosh link is shared (WhatsApp, Slack, LinkedIn, X, …). Rendered once at build time.

export const alt = "Kosh — petty cash, in control. Scan UPI screenshots, approve expenses and export reports.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontDir = path.join(process.cwd(), "node_modules", "@expo-google-fonts", "inter");
const fonts = Promise.all([
  readFile(path.join(fontDir, "400Regular", "Inter_400Regular.ttf")),
  readFile(path.join(fontDir, "600SemiBold", "Inter_600SemiBold.ttf")),
]);

// The dark theme's tokens (globals.css), as hex: the image renderer doesn't understand oklch().
const C = {
  background: "#0e0f11",
  card: "#18191c",
  border: "#2a2c30",
  foreground: "#f3f4f6",
  muted: "#a3a7af",
  primary: "#3ec691",
  primaryForeground: "#0b2a1f",
};

const ROWS = [
  ["ABC Stationery", "Office Supplies", "₹450.00", "Approved"],
  ["Metro card recharge", "Travel", "₹300.00", "Submitted"],
  ["Tea & snacks", "Refreshments", "₹120.00", "Pending"],
];

export default async function OpenGraphImage() {
  const [regular, semibold] = await fonts;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 80px",
          background: `radial-gradient(circle at 15% 0%, rgba(62, 198, 145, 0.22), transparent 55%), ${C.background}`,
          color: C.foreground,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: C.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.primaryForeground} strokeWidth="2.2" strokeLinecap="round">
                <rect x="4" y="7" width="16" height="12" rx="3" />
                <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
                <path d="M9.5 13h5" />
              </svg>
            </div>
            <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>Kosh</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 44, fontSize: 76, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.05 }}>
            <span>Petty cash,&nbsp;</span>
            <span style={{ color: C.primary }}>in control.</span>
          </div>
          <div style={{ marginTop: 26, fontSize: 30, lineHeight: 1.4, color: C.muted, maxWidth: 600 }}>
            Scan UPI screenshots, approve expenses and export reports. Built for Indian businesses.
          </div>
        </div>

        <div
          style={{
            width: 400,
            display: "flex",
            flexDirection: "column",
            padding: 30,
            borderRadius: 28,
            background: C.card,
            border: `1px solid ${C.border}`,
          }}
        >
          <span style={{ fontSize: 18, color: C.muted }}>Current cash balance</span>
          <span style={{ marginTop: 6, fontSize: 46, fontWeight: 600, letterSpacing: -1.5 }}>₹18,450.00</span>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, borderTop: `1px solid ${C.border}` }}>
            {ROWS.map(([name, category, amount, status]) => (
              <div
                key={name}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 19, fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: 15, color: C.muted }}>{category}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: 19, fontWeight: 600 }}>{amount}</span>
                  <span style={{ fontSize: 14, color: status === "Approved" ? C.primary : C.muted }}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: regular, style: "normal", weight: 400 },
        { name: "Inter", data: semibold, style: "normal", weight: 600 },
      ],
    },
  );
}

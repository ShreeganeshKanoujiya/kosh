import { ImageResponse } from "next/og";
import { OG_BACKGROUND, OG_COLORS as C, OG_SIZE, OgBrand, ogOptions } from "@/lib/og";

// The preview shown when a Kosh link is shared (WhatsApp, Slack, LinkedIn, X, …). Rendered once at build time.

export const alt = "Kosh — petty cash, in control. Scan UPI screenshots, approve expenses and export reports.";
export const size = OG_SIZE;
export const contentType = "image/png";

const ROWS = [
  ["ABC Stationery", "Office Supplies", "₹450.00", "Approved"],
  ["Metro card recharge", "Travel", "₹300.00", "Submitted"],
  ["Tea & snacks", "Refreshments", "₹120.00", "Pending"],
];

export default async function OpenGraphImage() {
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
          background: OG_BACKGROUND,
          color: C.foreground,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <OgBrand />

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
    await ogOptions(),
  );
}

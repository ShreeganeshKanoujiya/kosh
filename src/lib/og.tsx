import { readFile } from "node:fs/promises";
import path from "node:path";

// Shared by the share images (app/**/opengraph-image.tsx), which are rendered at build time.

export const OG_SIZE = { width: 1200, height: 630 };

const fontDir = path.join(process.cwd(), "node_modules", "@expo-google-fonts", "inter");
const fonts = Promise.all([
  readFile(path.join(fontDir, "400Regular", "Inter_400Regular.ttf")),
  readFile(path.join(fontDir, "600SemiBold", "Inter_600SemiBold.ttf")),
]);

/** `ImageResponse` options: the image size plus the Inter weights the images use. */
export async function ogOptions() {
  const [regular, semibold] = await fonts;
  return {
    ...OG_SIZE,
    fonts: [
      { name: "Inter", data: regular, style: "normal" as const, weight: 400 as const },
      { name: "Inter", data: semibold, style: "normal" as const, weight: 600 as const },
    ],
  };
}

// The dark theme's tokens (globals.css), as hex: the image renderer doesn't understand oklch().
export const OG_COLORS = {
  background: "#0e0f11",
  card: "#18191c",
  border: "#2a2c30",
  foreground: "#f3f4f6",
  muted: "#a3a7af",
  primary: "#3ec691",
  primaryForeground: "#0b2a1f",
};

export const OG_BACKGROUND = `radial-gradient(circle at 15% 0%, rgba(62, 198, 145, 0.22), transparent 55%), ${OG_COLORS.background}`;

/** The app mark and "Kosh" name, top-left of every share image. */
export function OgBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: OG_COLORS.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={OG_COLORS.primaryForeground} strokeWidth="2.2" strokeLinecap="round">
          <rect x="4" y="7" width="16" height="12" rx="3" />
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
          <path d="M9.5 13h5" />
        </svg>
      </div>
      <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>Kosh</span>
    </div>
  );
}

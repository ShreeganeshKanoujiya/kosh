import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Next.js needs inline scripts for hydration unless nonces are used; 'unsafe-eval' only in dev (React Refresh).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""} https://*.supabase.co`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

// PDF exports read Inter's TTFs from disk at runtime (for the ₹ glyph); make sure deployments ship them.
const pdfFonts = ["./node_modules/@expo-google-fonts/inter/400Regular/*.ttf", "./node_modules/@expo-google-fonts/inter/600SemiBold/*.ttf"];

// UPI screenshot OCR: Tesseract spawns its worker script by file path (invisible to tracing),
// loads a WebAssembly core, and reads the English model from disk.
const tesseractFiles = [
  "./node_modules/tesseract.js/src/**/*",
  "./node_modules/tesseract.js-core/tesseract-core-*lstm*",
  "./node_modules/tesseract.js-core/package.json",
  "./node_modules/@tesseract.js-data/eng/4.0.0_best_int/*",
  "./node_modules/{bmp-js,is-url,node-fetch,regenerator-runtime,wasm-feature-detect,zlibjs}/**/*",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Loaded natively instead of bundled: pdfkit and tesseract.js read files at runtime; nodemailer is Node-only.
  serverExternalPackages: ["pdfkit", "nodemailer", "tesseract.js"],
  allowedDevOrigins: ['192.168.0.191'],
  outputFileTracingIncludes: {
    "/api/reports/export": pdfFonts,
    "/api/transactions/export": pdfFonts,
    "/api/ocr/upi": tesseractFiles,
  },
  experimental: {
    // Enables forbidden() / unauthorized() and their 403 / 401 boundary files.
    authInterrupts: true,
  },
  async headers() {
    return [
      // Attachment files set their own, stricter policy per file type (see lib/storage/disk.ts).
      { source: "/:path((?!api/attachments/[^/]+/file$).*)", headers: securityHeaders },
      { source: "/api/attachments/:id/file", headers: securityHeaders.filter((h) => h.key !== "Content-Security-Policy") },
    ];
  },
};

export default nextConfig;

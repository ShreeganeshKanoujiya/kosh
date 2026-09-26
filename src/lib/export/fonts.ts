import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

// Inter has the ₹ glyph (PDF's built-in Helvetica doesn't). The files are traced into
// the server bundle by `outputFileTracingIncludes` in next.config.ts.
const FONT_DIR = path.join(process.cwd(), "node_modules", "@expo-google-fonts", "inter");

const LAYOUT_TABLES = new Set(["GSUB", "GPOS", "GDEF"]);
const pad4 = (n: number) => (n + 3) & ~3;

/**
 * The same TrueType font without its OpenType layout tables. Table cells don't need
 * ligatures, contextual alternates or kerning, and shaping every unique string (entry
 * numbers, amounts) through Inter's large GSUB made long PDFs ~8× slower.
 */
function withoutLayoutTables(ttf: Buffer): Buffer {
  const tables: { tag: string; checksum: number; offset: number; length: number }[] = [];
  for (let i = 0; i < ttf.readUInt16BE(4); i++) {
    const record = 12 + i * 16;
    const tag = ttf.toString("latin1", record, record + 4);
    if (LAYOUT_TABLES.has(tag)) continue;
    tables.push({ tag, checksum: ttf.readUInt32BE(record + 4), offset: ttf.readUInt32BE(record + 8), length: ttf.readUInt32BE(record + 12) });
  }

  // Rebuild the sfnt: header + table directory (still sorted by tag), then 4-byte aligned table data.
  const count = tables.length;
  const entrySelector = Math.floor(Math.log2(count));
  const searchRange = 2 ** entrySelector * 16;
  let offset = pad4(12 + count * 16);
  const out = Buffer.alloc(tables.reduce((size, t) => size + pad4(t.length), offset));
  ttf.copy(out, 0, 0, 4); // sfnt version
  out.writeUInt16BE(count, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(count * 16 - searchRange, 10);
  tables.forEach((t, i) => {
    const record = 12 + i * 16;
    out.write(t.tag, record, "latin1");
    out.writeUInt32BE(t.checksum, record + 4);
    out.writeUInt32BE(offset, record + 8);
    out.writeUInt32BE(t.length, record + 12);
    ttf.copy(out, offset, t.offset, t.offset + t.length);
    offset += pad4(t.length);
  });
  return out;
}

let fonts: { regular: Buffer; semibold: Buffer } | null = null;

/** Loaded and prepared once per server instance. */
export function pdfFonts() {
  fonts ??= {
    regular: withoutLayoutTables(readFileSync(path.join(FONT_DIR, "400Regular", "Inter_400Regular.ttf"))),
    semibold: withoutLayoutTables(readFileSync(path.join(FONT_DIR, "600SemiBold", "Inter_600SemiBold.ttf"))),
  };
  return fonts;
}

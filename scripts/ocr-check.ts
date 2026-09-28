/**
 * Try the UPI screenshot reader on real screenshots:
 *
 *   npm run ocr:check -- path/to/screenshot.png [more.png | a-folder]
 *
 * Prints what was detected (with confidence) for each image. If a folder contains an
 * `expected.json` ({ "file.png": { "amount": "450.00", "upiId": "…", … } }), results are
 * compared against it and the command fails on any mismatch — a regression suite for
 * screenshots you've collected. Add `--raw` to see the text Tesseract read.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { recognizeLines } from "@/lib/ocr/tesseract";
import { parseUpiText, type UpiExtraction } from "@/lib/ocr/upi-parser";

type Expected = Record<string, Partial<Record<keyof UpiExtraction["fields"] | "app" | "status" | "direction", string | null>>>;

const IMAGE = /\.(png|jpe?g|webp)$/i;
const args = process.argv.slice(2);
const raw = args.includes("--raw");
const targets = args.filter((a) => !a.startsWith("--"));
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

function collect(): { file: string; expected?: Expected[string] | "none" }[] {
  const out: { file: string; expected?: Expected[string] | "none" }[] = [];
  for (const target of targets) {
    if (statSync(target).isDirectory()) {
      const expectedFile = path.join(target, "expected.json");
      const expected: Expected = existsSync(expectedFile) ? JSON.parse(readFileSync(expectedFile, "utf8")) : {};
      for (const name of readdirSync(target).filter((n) => IMAGE.test(n)).sort()) {
        out.push({ file: path.join(target, name), expected: name in expected ? (expected[name] ?? "none") : undefined });
      }
    } else {
      out.push({ file: target });
    }
  }
  return out;
}

async function main() {
  if (!targets.length) {
    console.error("Usage: npm run ocr:check -- <image or folder> [...] [--raw]");
    process.exit(2);
  }
  let checked = 0;
  let mismatches = 0;
  for (const { file, expected } of collect()) {
    const started = Date.now();
    const lines = await recognizeLines(readFileSync(file));
    const result = parseUpiText(lines, today);
    console.log(`\n=== ${path.basename(file)} (${Date.now() - started} ms)`);
    if (raw) for (const l of lines) console.log(`   | ${String(Math.round(l.confidence)).padStart(3)} h${Math.round(l.height)} ${l.text}`);

    if (!result) console.log("   no payment details found");
    else {
      console.log(`   app=${result.app ?? "?"}  status=${result.status}  direction=${result.direction}`);
      for (const [key, f] of Object.entries(result.fields)) console.log(`   ${key.padEnd(16)} ${String(f.value ?? "—").padEnd(30)} ${f.value ? `${f.confidence}%` : ""}`);
    }

    if (expected !== undefined) {
      checked++;
      const problems: string[] = [];
      if (expected === "none") {
        if (result) problems.push("expected no payment details");
      } else if (!result) {
        problems.push("nothing detected");
      } else {
        for (const [key, want] of Object.entries(expected)) {
          const got = key in result.fields ? result.fields[key as keyof UpiExtraction["fields"]].value : (result as unknown as Record<string, unknown>)[key];
          if ((got ?? null) !== want) problems.push(`${key}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got ?? null)}`);
        }
      }
      if (problems.length) {
        mismatches++;
        for (const p of problems) console.log(`   ✘ ${p}`);
      } else console.log("   ✔ matches expected");
    }
  }
  if (checked) console.log(`\n${checked - mismatches}/${checked} screenshots match expected.json`);
  process.exit(mismatches ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

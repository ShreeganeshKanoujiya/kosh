import { ImageResponse } from "next/og";
import { HELP_ARTICLES, getHelpArticle, helpCategory } from "@/content/help";
import { OG_BACKGROUND, OG_COLORS as C, OG_SIZE, OgBrand, ogOptions } from "@/lib/og";

// Each help article's share preview: its title and summary, so a shared link says what it's about.

export const alt = "Kosh help center article";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function HelpArticleImage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getHelpArticle((await params).slug)!;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: OG_BACKGROUND,
          color: C.foreground,
          fontFamily: "Inter",
        }}
      >
        <OgBrand />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: C.primary }}>Help center · {helpCategory(article.category).title}</span>
          <span style={{ marginTop: 18, fontSize: 68, fontWeight: 600, letterSpacing: -2, lineHeight: 1.08, maxWidth: 1000 }}>{article.title}</span>
          <span style={{ marginTop: 24, fontSize: 30, lineHeight: 1.4, color: C.muted, maxWidth: 980 }}>{article.description}</span>
        </div>
      </div>
    ),
    await ogOptions(),
  );
}

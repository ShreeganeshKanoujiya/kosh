"use client";

// Replaces the root layout when it fails, so it cannot rely on globals.css or providers.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <title>Something went wrong · Kosh</title>
        <div>
          <p style={{ fontFamily: "monospace", letterSpacing: "0.2em", color: "#0a7c56", margin: 0 }}>500</p>
          <h1 style={{ fontSize: 24, margin: "8px 0" }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, margin: "0 0 24px" }}>
            Please try again.{error.digest ? ` (Ref: ${error.digest})` : ""}
          </p>
          <button
            onClick={() => retry()}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: 0,
              background: "#0a7c56",
              color: "white",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

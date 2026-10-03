import { ImageResponse } from "next/og";
import type { Settings } from "@/db/schema";

const HEX = /^#[0-9a-f]{6}$/i;

/** A branded 1200×630 share image: title, optional eyebrow and footer line, in the blog's colours. */
export function ogCard(settings: Settings, { eyebrow, title, footer }: { eyebrow?: string; title: string; footer?: string }) {
  const navy = HEX.test(settings.navyColor) ? settings.navyColor : "#0A1F44";
  const gold = HEX.test(settings.accentColor) ? settings.accentColor : "#C8922A";
  const brand = settings.blogTitle || "The Journal";
  const size = title.length > 80 ? 54 : title.length > 45 ? 64 : 76;

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
          background: navy,
          color: "#ffffff",
          fontFamily: "sans-serif",
          borderBottom: `16px solid ${gold}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            {brand[0]?.toUpperCase() || "J"}
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, opacity: 0.9 }}>{brand}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {eyebrow && (
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: gold }}>
              {eyebrow}
            </div>
          )}
          <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.12, display: "flex" }}>{title}</div>
        </div>

        <div style={{ fontSize: 26, opacity: 0.65, display: "flex" }}>{footer || settings.tagline}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
  );
}

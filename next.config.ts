import type { NextConfig } from "next";

// When STATIC_EXPORT=true (set by the GitHub Pages workflow), build a fully
// static site into `out/`. PAGES_BASE_PATH is the repo sub-path on
// <user>.github.io (e.g. "/KelzPost"); leave empty for a custom domain.
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.72"],
  ...(isStaticExport && {
    output: "export",
    trailingSlash: true,
    basePath,
    images: { unoptimized: true },
  }),
};

export default nextConfig;

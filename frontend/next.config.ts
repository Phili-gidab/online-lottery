import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the whole site becomes plain HTML/CSS/JS that any shared
  // hosting (Apache/LiteSpeed) can serve. Data is fetched client-side from
  // the Laravel API on the same domain.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

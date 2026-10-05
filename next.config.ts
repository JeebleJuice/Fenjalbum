import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    webpackBuildWorker: false,
    useTypeScriptCli: false
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;

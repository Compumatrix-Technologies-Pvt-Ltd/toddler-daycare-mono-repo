import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/**" },
      { protocol: "https", hostname: "**" },
    ],
  },
  transpilePackages: ["@repo/shared"],
};

export default nextConfig;

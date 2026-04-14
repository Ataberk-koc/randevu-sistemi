import type { NextConfig } from "next";

const nextConfig = {
  serverActions: {
    bodySizeLimit: "50mb", // PDF dosyalarını yüklemek için boyut sınırını artırdık
  },
} as NextConfig;

export default nextConfig;

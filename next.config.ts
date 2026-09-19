import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pastikan file sumber Google Apps Script (folder /gas) ikut tersedia
  // saat aplikasi dijalankan dari output produksi.
  outputFileTracingIncludes: {
    "/**": ["./gas/**/*"],
  },
};

export default nextConfig;

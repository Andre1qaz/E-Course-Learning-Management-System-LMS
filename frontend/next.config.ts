import type { NextConfig } from "next";

const PRODUCTION_URL = "https://e-course-learning-management-system.vercel.app";

function resolveNextAuthUrl(): string {
  // Kalau sudah di-set di environment (dashboard Vercel), selalu pakai itu.
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Production -> paksa domain production (hindari preview URL berubah-ubah).
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_URL;
  }

  // Non-production: fallback ke VERCEL_URL (preview) lalu localhost.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  env: {
    NEXTAUTH_URL: resolveNextAuthUrl(),
  },
};

export default nextConfig;

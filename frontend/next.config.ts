import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  env: {
    // Force NEXTAUTH_URL to production URL if in Vercel environment
    // This prevents NextAuth from using preview deployment URLs for callbacks
    NEXTAUTH_URL: process.env.NODE_ENV === 'production'
      ? process.env.NEXTAUTH_URL || 'https://e-course-learning-management-system.vercel.app'
      : process.env.NEXTAUTH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000',
  },
};

export default nextConfig;

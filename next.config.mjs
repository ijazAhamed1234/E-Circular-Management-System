/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prevent Next.js from bundling native Node modules used server-side only
  serverExternalPackages: ['sqlite3', 'sqlite', 'bcryptjs'],
};

export default nextConfig;

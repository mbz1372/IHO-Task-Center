import path from 'path';
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: path.join(process.cwd()),
  webpack: (config) => { config.optimization.minimize = false; return config; }
};
export default nextConfig;

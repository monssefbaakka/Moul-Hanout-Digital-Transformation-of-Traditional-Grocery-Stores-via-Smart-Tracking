import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@moul-hanout/shared-types', '@moul-hanout/shared-utils'],
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},  // empty config silences the error, turbopack handles hot reload natively
}

export default nextConfig
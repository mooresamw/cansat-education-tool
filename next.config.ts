import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        
      },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true, // Ignores TypeScript type checking errors
    },
};

export default nextConfig;
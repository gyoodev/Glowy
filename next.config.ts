import type {NextConfig} from 'next';
import path from 'path'; // Import path

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, {isServer}) => {
    // Add alias for @ to resolve to src directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Add externals for server-side builds if needed
    if (isServer) {
      config.externals.push('@paypal/paypal-js');
    }

    // Preserve existing webpack configuration
    return config;
  },
};

export default nextConfig;

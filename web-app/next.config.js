/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
			config.resolve.alias = {
        ...config.resolve.alias,
        '@farcaster/mini-app-solana': false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Exclude packages that use native Node.js modules from the server bundle
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "sharp"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = Object.assign({}, config.resolve.fallback || {}, {
        bufferutil: false,
        "utf-8-validate": false,
      });
    }
    return config;
  },
};

export default nextConfig;

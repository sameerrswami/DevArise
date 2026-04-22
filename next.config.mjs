const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    // Exclude packages with native Node.js bindings from the server bundle
    serverComponentsExternalPackages: ["pdf-parse", "sharp", "@prisma/client", "prisma"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = Object.assign({}, config.resolve.fallback || {}, {
        bufferutil: false,
        "utf-8-validate": false,
        fs: false,
        net: false,
        tls: false,
      });
    }
    return config;
  },
};

export default nextConfig;

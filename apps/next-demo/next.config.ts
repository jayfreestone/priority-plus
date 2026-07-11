import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Import the prelayout classic script's source as a string. (Reading it
  // with fs + createRequire().resolve() doesn't survive Turbopack, which
  // rewrites require.resolve to an internal module id.)
  turbopack: {
    rules: {
      "*.iife.js": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;

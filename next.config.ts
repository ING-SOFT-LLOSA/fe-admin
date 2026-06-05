import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/projects",
        destination: "/proyectos",
        permanent: false,
      },
      {
        source: "/projects/:id/cronograma-pagos",
        destination: "/finanzas?project=:id",
        permanent: false,
      }
    ];
  },
  output: "standalone",
};

export default nextConfig;

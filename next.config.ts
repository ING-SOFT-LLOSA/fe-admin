import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login-empresa",
        permanent: false,
      },
      {
        source: "/proyectos",
        destination: "/projects",
        permanent: true,
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

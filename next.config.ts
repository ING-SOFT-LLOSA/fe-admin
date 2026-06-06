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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' blob: data: https://lh3.googleusercontent.com https://*.googleapis.com https://*.firebaseapp.com;",
              "font-src 'self' data: https://fonts.gstatic.com;",
              "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://*.ingsoftware.lat https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://*.firebaseio.com;",
              "frame-src 'self' https://*.firebaseapp.com;",
              "object-src 'none';",
              "base-uri 'self';",
              "form-action 'self';",
              "frame-ancestors 'none';",
              "upgrade-insecure-requests;",
            ].join(" "),
          },
        ],
      },
    ];
  },
  output: "standalone",
};

export default nextConfig;

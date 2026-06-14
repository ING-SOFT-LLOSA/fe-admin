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
    const isProd = process.env.NODE_ENV === "production";

    const scriptSrc = isProd
      ? "script-src 'self' https://apis.google.com https://www.gstatic.com;"
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com;";

    const connectSrc = isProd
      ? "connect-src 'self' https://*.ingsoftware.lat https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://*.firebaseio.com;"
      : "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://*.ingsoftware.lat https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://*.firebaseio.com;";

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
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' blob: data: https://lh3.googleusercontent.com https://*.googleapis.com https://*.firebaseapp.com;",
              "font-src 'self' data: https://fonts.gstatic.com;",
              connectSrc,
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

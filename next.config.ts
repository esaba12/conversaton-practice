import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'" },
    ] }];
  },
};
export default config;

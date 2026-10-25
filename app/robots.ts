import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/checkout/",
          "/profile/",
          "/orders/",
        ],
      },
    ],
    sitemap: "https://gadgetskabila.com/sitemap.xml",
  };
}

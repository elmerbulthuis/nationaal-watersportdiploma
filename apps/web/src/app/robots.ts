import { constants } from "@nawadi/lib";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/diploma/"],
    },
    sitemap: `${constants.WEBSITE_URL}/sitemap.xml`,
  };
}

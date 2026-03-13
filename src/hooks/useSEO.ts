import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  updatePageTitle,
  updateMetaDescription,
  updateMetaKeywords,
  addCanonicalLink,
  updateOpenGraphTags,
  updateTwitterTags,
  injectStructuredData,
  seoData,
  structuredData,
} from "../utils/seo";

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  noIndex?: boolean;
}

export const useSEO = (pageData?: SEOData) => {
  const location = useLocation();

  useEffect(() => {
    const getDefaultSEOData = () => {
      const path = location.pathname;
      if (path === "/") return seoData.home;
      if (path === "/espaces" || path === "/espaces-tarifs") return seoData.spaces;
      if (path === "/tarifs") return seoData.pricing;
      if (path === "/a-propos") return seoData.about;
      if (path.includes("/domiciliation")) return seoData.domiciliation;
      return seoData.home;
    };

    const defaultData = getDefaultSEOData();
    const title = pageData?.title || defaultData.title;
    const description = pageData?.description || defaultData.description;
    const keywords = pageData?.keywords || defaultData.keywords;
    let canonical =
      pageData?.canonical || `https://coffice.dz${location.pathname}`;

    if (location.pathname === "/tarifs") {
      canonical = "https://coffice.dz/espaces";
    }

    const image = pageData?.image || "https://coffice.dz/og-coffice.jpg";

    updatePageTitle(title);
    updateMetaDescription(description);
    updateMetaKeywords(keywords);
    addCanonicalLink(canonical);

    updateOpenGraphTags({
      title,
      description,
      url: canonical,
      image,
    });

    updateTwitterTags({
      title,
      description,
      image,
    });

    if (pageData?.noIndex) {
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement("meta");
        robotsMeta.setAttribute("name", "robots");
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute("content", "noindex, nofollow");
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        robotsMeta.setAttribute("content", "index, follow");
      }
    }

    const breadcrumbMap: Record<string, { name: string; path: string }[]> = {
      "/": [],
      "/espaces": [{ name: "Nos Espaces", path: "/espaces" }],
      "/tarifs": [{ name: "Nos Espaces", path: "/espaces" }],
      "/domiciliation": [{ name: "Domiciliation", path: "/domiciliation" }],
      "/a-propos": [{ name: "À Propos", path: "/a-propos" }],
      "/blog": [{ name: "Blog", path: "/blog" }],
      "/mentions-legales": [{ name: "Mentions Légales", path: "/mentions-legales" }],
    };

    const breadcrumbs = breadcrumbMap[location.pathname];
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: "https://coffice.dz/" },
          ...breadcrumbs.map((b, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: b.name,
            item: `https://coffice.dz${b.path}`,
          })),
        ],
      };
      const existing = document.querySelector('script[data-breadcrumb="true"]');
      if (existing) existing.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-breadcrumb", "true");
      script.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(script);
    }

    if (location.pathname === "/") {
      injectStructuredData([
        structuredData.organization,
        structuredData.faq,
      ]);
    } else {
      injectStructuredData(structuredData.organization);
    }
  }, [location.pathname, pageData]);
};


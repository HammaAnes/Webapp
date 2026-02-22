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
    const canonical =
      pageData?.canonical || `https://coffice.dz${location.pathname}`;
    const image = pageData?.image || "https://coffice.dz/espace-coworking.jpeg";

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


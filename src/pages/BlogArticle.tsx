import { useMemo, useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  User,
  Share2,
  BookOpen,
  ChevronRight,
  List,
  ChevronUp,
  CheckCircle2,
  Building2,
  Scale,
  Calculator,
  Users,
  Rocket,
  FileSpreadsheet,
  Banknote,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { blogArticles, blogCategories } from "../data/blogArticles";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const categoryIcons: Record<string, React.ElementType> = {
  Building2,
  Scale,
  Calculator,
  Users,
  Rocket,
  FileSpreadsheet,
  Banknote,
  Lightbulb,
};

const difficultyConfig = {
  "débutant": { color: "bg-green-100 text-green-700 border-green-200", label: "Débutant", icon: "1" },
  "intermédiaire": { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Intermédiaire", icon: "2" },
  "avancé": { color: "bg-red-100 text-red-700 border-red-200", label: "Avancé", icon: "3" },
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const article = useMemo(() => {
    return blogArticles.find((a) => a.slug === slug);
  }, [slug]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return blogArticles
      .filter(
        (a) => a.id !== article.id && a.category === article.category
      )
      .slice(0, 3);
  }, [article]);

  const tableOfContents = useMemo(() => {
    if (!article) return [];
    const headings: { id: string; title: string; level: number }[] = [];
    const lines = article.content.split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        const title = trimmed.replace("## ", "");
        headings.push({
          id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          title,
          level: 2,
        });
      } else if (trimmed.startsWith("### ")) {
        const title = trimmed.replace("### ", "");
        headings.push({
          id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          title,
          level: 3,
        });
      }
    });
    return headings;
  }, [article]);

  useSEO(
    article
      ? {
          title: `${article.title} | Blog Coffice`,
          description: article.excerpt,
        }
      : {}
  );

  useEffect(() => {
    if (!article) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-blog-schema", "true");
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "datePublished": article.publishedAt,
      "dateModified": article.updatedAt || article.publishedAt,
      "author": { "@type": "Organization", "name": "Coffice", "url": "https://coffice.dz" },
      "publisher": {
        "@type": "Organization",
        "name": "Coffice",
        "logo": { "@type": "ImageObject", "url": "https://coffice.dz/logo-web-transparent-black.png" }
      },
      "mainEntityOfPage": `https://coffice.dz/blog/${article.slug}`,
      "description": article.excerpt,
      "articleSection": article.category,
      "wordCount": article.content.split(/\s+/).length,
      "inLanguage": "fr-DZ"
    });
    document.head.appendChild(script);
    return () => {
      const existing = document.querySelector('script[data-blog-schema="true"]');
      if (existing) existing.remove();
    };
  }, [article]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const categoryInfo = blogCategories.find((c) => c.id === article.category) || {
    name: article.category,
    color: "bg-gray-500",
    icon: "Lightbulb",
  };

  const IconComponent = categoryIcons[categoryInfo.icon || "Lightbulb"] || Lightbulb;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch {
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  const renderContent = () => {
    const lines = article.content.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListTag = listType === "ol" ? "ol" : "ul";
        elements.push(
          <ListTag
            key={`list-${elements.length}`}
            className={`mb-6 space-y-2 ${listType === "ol" ? "list-decimal" : "list-disc"} list-inside text-gray-600`}
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      if (trimmed.startsWith("## ")) {
        flushList();
        const title = trimmed.replace("## ", "");
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        elements.push(
          <h2
            key={index}
            id={id}
            className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 scroll-mt-24 flex items-center gap-3"
          >
            <span className="w-1 h-8 bg-amber-500 rounded-full" />
            {title}
          </h2>
        );
        return;
      }

      if (trimmed.startsWith("### ")) {
        flushList();
        const title = trimmed.replace("### ", "");
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        elements.push(
          <h3
            key={index}
            id={id}
            className="text-xl md:text-2xl font-semibold text-gray-900 mt-8 mb-4 scroll-mt-24"
          >
            {title}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        flushList();
        elements.push(
          <p key={index} className="font-semibold text-gray-900 mb-4 text-lg">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
        return;
      }

      if (trimmed.startsWith("- ")) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        listItems.push(trimmed.replace("- ", ""));
        return;
      }

      if (/^\d+\./.test(trimmed)) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        listItems.push(trimmed.replace(/^\d+\.\s*/, ""));
        return;
      }

      if (trimmed.startsWith("|")) {
        return;
      }

      flushList();
      elements.push(
        <p key={index} className="text-gray-600 mb-4 leading-relaxed text-lg">
          {trimmed}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Retour au blog
              </Link>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${categoryInfo.color} text-white text-sm font-medium rounded-full`}>
                  <IconComponent className="w-4 h-4" />
                  {categoryInfo.name}
                </span>
                {article.difficulty && (
                  <span className={`px-3 py-1.5 text-sm font-medium rounded-full border ${difficultyConfig[article.difficulty].color}`}>
                    Niveau : {difficultyConfig[article.difficulty].label}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  {article.readTime} min de lecture
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {article.excerpt}
              </p>

              <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {article.author}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(article.publishedAt), "dd MMMM yyyy", { locale: fr })}
                      </span>
                      {article.updatedAt && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" />
                          Mis à jour le {format(new Date(article.updatedAt), "dd MMM yyyy", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-700 rounded-xl transition-colors font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
              </div>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8">
              {tableOfContents.length > 3 && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:w-64 flex-shrink-0 order-2 lg:order-1"
                >
                  <div className="lg:sticky lg:top-24 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <List className="w-4 h-4 text-amber-500" />
                      Sommaire
                    </h3>
                    <nav className="space-y-1">
                      {tableOfContents.map((heading) => (
                        <button
                          key={heading.id}
                          onClick={() => scrollToSection(heading.id)}
                          className={`block w-full text-left text-sm py-1.5 transition-colors ${
                            heading.level === 3 ? "pl-4" : ""
                          } ${
                            activeSection === heading.id
                              ? "text-amber-600 font-medium"
                              : "text-gray-600 hover:text-amber-600"
                          }`}
                        >
                          {heading.title}
                        </button>
                      ))}
                    </nav>
                  </div>
                </motion.aside>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`flex-1 order-1 lg:order-2 ${tableOfContents.length <= 3 ? "max-w-none" : ""}`}
              >
                <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100">
                  <div className="prose prose-lg max-w-none">
                    {renderContent()}
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">
                            Cet article vous a été utile ?
                          </h4>
                          <p className="text-gray-600 text-sm mb-4">
                            Partagez-le avec d'autres entrepreneurs qui pourraient en bénéficier.
                          </p>
                          <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            Partager l'article
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {article.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?search=${tag}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-amber-100 hover:text-amber-700 transition-colors text-sm font-medium"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {relatedArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                  Articles similaires
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((related) => {
                    const relatedCategoryInfo = blogCategories.find((c) => c.id === related.category) || {
                      name: related.category,
                      color: "bg-gray-500",
                      icon: "Lightbulb",
                    };
                    const RelatedIcon = categoryIcons[relatedCategoryInfo.icon || "Lightbulb"] || Lightbulb;

                    return (
                      <Link
                        key={related.id}
                        to={`/blog/${related.slug}`}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group"
                      >
                        <div className={`w-10 h-10 rounded-xl ${relatedCategoryInfo.color} flex items-center justify-center mb-4`}>
                          <RelatedIcon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                          {related.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {related.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {related.readTime} min
                          </span>
                          <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium group-hover:gap-2 transition-all">
                            Lire
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </article>

      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>
      )}

    </div>
  );
};

export default BlogArticle;

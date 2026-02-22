import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Calendar,
  Tag,
  Search,
  ChevronRight,
  Filter,
  User,
  TrendingUp,
  Star,
  Building2,
  Scale,
  Calculator,
  Users,
  Rocket,
  FileSpreadsheet,
  Banknote,
  Lightbulb,
  GraduationCap,
  ArrowRight,
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
  "débutant": { color: "bg-green-100 text-green-700", label: "Débutant" },
  "intermédiaire": { color: "bg-amber-100 text-amber-700", label: "Intermédiaire" },
  "avancé": { color: "bg-red-100 text-red-700", label: "Avancé" },
};

const Blog = () => {
  useSEO({
    title: "Blog - Coffice | Guides et conseils pour entrepreneurs en Algérie",
    description:
      "Guides complets sur la création d'entreprise, la fiscalité, les startups et toutes les démarches administratives en Algérie. Votre référence entrepreneuriale.",
  });

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const featuredArticles = useMemo(() => {
    return blogArticles.filter((article) => article.featured).slice(0, 3);
  }, []);

  const filteredArticles = useMemo(() => {
    return blogArticles.filter((article) => {
      const matchesSearch =
        searchQuery === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === null || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryInfo = (categoryId: string) => {
    return (
      blogCategories.find((c) => c.id === categoryId) || {
        name: categoryId,
        color: "bg-gray-500",
        icon: "Lightbulb",
        description: "",
      }
    );
  };

  const getCategoryIcon = (iconName: string) => {
    return categoryIcons[iconName] || Lightbulb;
  };

  const displayedCategories = showAllCategories
    ? blogCategories
    : blogCategories.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIG9wYWNpdHk9Ii4wNSIgZmlsbD0iI2ZmZiIvPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-amber-500/30">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">
                Centre de ressources pour entrepreneurs
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Votre guide complet pour{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                entreprendre en Algérie
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
              Guides pratiques, tutoriels détaillés et conseils d'experts pour créer,
              gérer et développer votre entreprise. De la création aux obligations fiscales,
              tout ce dont vous avez besoin.
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un guide, une procédure, un formulaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/10 backdrop-blur-sm text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {["création entreprise", "SARL", "fiscalité", "auto-entrepreneur", "CNAS"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-full border border-white/10 hover:border-white/20 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {!searchQuery && !selectedCategory && featuredArticles.length > 0 && (
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Articles à la une</h2>
                  <p className="text-gray-600">Les guides essentiels pour bien démarrer</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article, index) => {
                const categoryInfo = getCategoryInfo(article.category);
                const IconComponent = getCategoryIcon(categoryInfo.icon || "Lightbulb");

                return (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group relative rounded-3xl overflow-hidden ${
                      index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                    }`}
                  >
                    <Link
                      to={`/blog/${article.slug}`}
                      className={`block h-full ${
                        index === 0
                          ? "bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-10"
                          : "bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-6"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${categoryInfo.color} text-white text-xs font-medium rounded-full`}>
                          <IconComponent className="w-3.5 h-3.5" />
                          {categoryInfo.name}
                        </span>
                        {article.difficulty && (
                          <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${difficultyConfig[article.difficulty].color}`}>
                            {difficultyConfig[article.difficulty].label}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-bold mb-3 group-hover:text-amber-500 transition-colors ${
                        index === 0 ? "text-2xl md:text-3xl text-white" : "text-xl text-gray-900"
                      }`}>
                        {article.title}
                      </h3>

                      <p className={`mb-6 line-clamp-3 ${
                        index === 0 ? "text-slate-300 text-lg" : "text-gray-600"
                      }`}>
                        {article.excerpt}
                      </p>

                      <div className={`flex items-center justify-between mt-auto ${
                        index === 0 ? "text-slate-400" : "text-gray-500"
                      }`}>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {article.readTime} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(article.publishedAt), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>

                        <span className={`inline-flex items-center gap-1 font-medium text-sm ${
                          index === 0 ? "text-amber-400" : "text-amber-600"
                        }`}>
                          Lire
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-xl">
              <Filter className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Explorer par catégorie</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayedCategories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              const articleCount = blogArticles.filter(a => a.category === category.id).length;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    selectedCategory === category.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center mb-3`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500">{articleCount} article{articleCount > 1 ? "s" : ""}</p>
                </button>
              );
            })}
          </div>

          {blogCategories.length > 4 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1 mx-auto"
            >
              {showAllCategories ? "Voir moins" : `Voir toutes les catégories (${blogCategories.length})`}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAllCategories ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    Tags populaires
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    "création entreprise",
                    "SARL",
                    "EURL",
                    "fiscalité",
                    "TVA",
                    "IBS",
                    "CNAS",
                    "CASNOS",
                    "startup",
                    "auto-entrepreneur",
                    "registre commerce",
                    "domiciliation",
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        searchQuery === tag
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Statistiques</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total articles</span>
                      <span className="font-semibold text-gray-900">{blogArticles.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Catégories</span>
                      <span className="font-semibold text-gray-900">{blogCategories.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Temps de lecture total</span>
                      <span className="font-semibold text-gray-900">
                        {blogArticles.reduce((acc, a) => acc + a.readTime, 0)} min
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="mt-6 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    Effacer le filtre
                  </button>
                )}
              </div>
            </aside>

            <main className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory
                    ? getCategoryInfo(selectedCategory).name
                    : searchQuery
                      ? `Résultats pour "${searchQuery}"`
                      : "Tous les articles"
                  }
                </h2>
                <span className="text-gray-500">
                  {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""}
                </span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Aucun article trouvé
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Essayez de modifier vos critères de recherche
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                    }}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Voir tous les articles
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article, index) => {
                    const categoryInfo = getCategoryInfo(article.category);
                    const IconComponent = getCategoryIcon(categoryInfo.icon || "Lightbulb");

                    return (
                      <motion.article
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                      >
                        <Link
                          to={`/blog/${article.slug}`}
                          className="block p-6"
                        >
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className={`hidden md:flex w-14 h-14 rounded-2xl ${categoryInfo.color} items-center justify-center flex-shrink-0`}>
                              <IconComponent className="w-7 h-7 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${categoryInfo.color} text-white text-xs font-medium rounded-full md:hidden`}>
                                  <IconComponent className="w-3 h-3" />
                                  {categoryInfo.name}
                                </span>
                                <span className="hidden md:inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                  {categoryInfo.name}
                                </span>
                                {article.difficulty && (
                                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${difficultyConfig[article.difficulty].color}`}>
                                    {difficultyConfig[article.difficulty].label}
                                  </span>
                                )}
                                {article.featured && (
                                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    À la une
                                  </span>
                                )}
                              </div>

                              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                                {article.title}
                              </h2>

                              <p className="text-gray-600 mb-4 line-clamp-2 text-sm md:text-base">
                                {article.excerpt}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {article.author}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {article.readTime} min
                                  </span>
                                  <span className="hidden sm:flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(article.publishedAt), "dd MMM yyyy", { locale: fr })}
                                  </span>
                                </div>

                                <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm group-hover:gap-2 transition-all">
                                  Lire
                                  <ChevronRight className="w-4 h-4" />
                                </span>
                              </div>

                              {article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                  {article.tags.slice(0, 5).map((tag) => (
                                    <span
                                      key={tag}
                                      className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full"
                                    >
                                      <Tag className="w-3 h-3" />
                                      {tag}
                                    </span>
                                  ))}
                                  {article.tags.length > 5 && (
                                    <span className="text-xs text-gray-400 px-2 py-1">
                                      +{article.tags.length - 5}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Besoin d'un espace pour travailler ?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Coffice vous offre des espaces de coworking modernes et une domiciliation
            d'entreprise professionnelle au coeur d'Alger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/espaces"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors"
            >
              Découvrir nos espaces
            </Link>
            <Link
              to="/domiciliation"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold transition-colors"
            >
              Service de domiciliation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;

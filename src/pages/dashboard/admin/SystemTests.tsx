import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Zap,
  Database,
  Globe,
  Users,
  Building,
  Calendar,
  CreditCard,
  Mail,
  Shield,
  FileText,
  TrendingUp,
  Server,
  Loader,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import toast from "react-hot-toast";
import { apiClient } from "../../../lib/api-client";
import { formatDate } from "../../../utils/formatters";

interface TestResult {
  id: string;
  name: string;
  category: string;
  status: "pending" | "running" | "success" | "error" | "warning";
  message: string;
  duration?: number;
  details?: string;
}

interface TestCategory {
  id: string;
  name: string;
  icon: typeof Globe;
  description: string;
  tests: TestResult[];
}

const SystemTests = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const categories: TestCategory[] = [
    {
      id: "frontend",
      name: "Interface Utilisateur",
      icon: Globe,
      description: "Tests de l'interface frontend React",
      tests: [
        {
          id: "frontend-1",
          name: "Chargement des pages publiques",
          category: "frontend",
          status: "pending",
          message: "Accueil, Espaces, À propos, Blog",
        },
        {
          id: "frontend-2",
          name: "Navigation et routage",
          category: "frontend",
          status: "pending",
          message: "Liens internes et redirections",
        },
        {
          id: "frontend-3",
          name: "Chargement des assets",
          category: "frontend",
          status: "pending",
          message: "Images, logo, icônes",
        },
        {
          id: "frontend-4",
          name: "Responsive design",
          category: "frontend",
          status: "pending",
          message: "Mobile, tablette, desktop",
        },
      ],
    },
    {
      id: "auth",
      name: "Authentification",
      icon: Shield,
      description: "Tests du système d'authentification",
      tests: [
        {
          id: "auth-1",
          name: "Connexion utilisateur",
          category: "auth",
          status: "pending",
          message: "Login avec email/password",
        },
        {
          id: "auth-2",
          name: "Inscription utilisateur",
          category: "auth",
          status: "pending",
          message: "Création de compte",
        },
        {
          id: "auth-3",
          name: "Token JWT",
          category: "auth",
          status: "pending",
          message: "Génération et validation",
        },
        {
          id: "auth-4",
          name: "Protection des routes",
          category: "auth",
          status: "pending",
          message: "Accès admin restreint",
        },
      ],
    },
    {
      id: "users",
      name: "Gestion Utilisateurs",
      icon: Users,
      description: "Tests CRUD des utilisateurs",
      tests: [
        {
          id: "users-1",
          name: "Création utilisateur",
          category: "users",
          status: "pending",
          message: "POST /api/users",
        },
        {
          id: "users-2",
          name: "Liste des utilisateurs",
          category: "users",
          status: "pending",
          message: "GET /api/users",
        },
        {
          id: "users-3",
          name: "Modification utilisateur",
          category: "users",
          status: "pending",
          message: "PUT /api/users/:id",
        },
        {
          id: "users-4",
          name: "Suspension utilisateur",
          category: "users",
          status: "pending",
          message: "Changement de statut",
        },
      ],
    },
    {
      id: "spaces",
      name: "Gestion Espaces",
      icon: Building,
      description: "Tests des espaces de coworking",
      tests: [
        {
          id: "spaces-1",
          name: "Liste des espaces",
          category: "spaces",
          status: "pending",
          message: "GET /api/espaces",
        },
        {
          id: "spaces-2",
          name: "Création d'espace",
          category: "spaces",
          status: "pending",
          message: "POST /api/espaces",
        },
        {
          id: "spaces-3",
          name: "Modification d'espace",
          category: "spaces",
          status: "pending",
          message: "PUT /api/espaces/:id",
        },
        {
          id: "spaces-4",
          name: "Disponibilité espace",
          category: "spaces",
          status: "pending",
          message: "Activation/Désactivation",
        },
      ],
    },
    {
      id: "reservations",
      name: "Réservations",
      icon: Calendar,
      description: "Tests du système de réservation",
      tests: [
        {
          id: "reservations-1",
          name: "Création de réservation",
          category: "reservations",
          status: "pending",
          message: "POST /api/reservations",
        },
        {
          id: "reservations-2",
          name: "Vérification disponibilité",
          category: "reservations",
          status: "pending",
          message: "Check slots disponibles",
        },
        {
          id: "reservations-3",
          name: "Confirmation réservation",
          category: "reservations",
          status: "pending",
          message: "Changement statut admin",
        },
        {
          id: "reservations-4",
          name: "Annulation réservation",
          category: "reservations",
          status: "pending",
          message: "DELETE ou statut annulée",
        },
      ],
    },
    {
      id: "abonnements",
      name: "Abonnements",
      icon: CreditCard,
      description: "Tests des abonnements et souscriptions",
      tests: [
        {
          id: "abonnements-1",
          name: "Liste des plans",
          category: "abonnements",
          status: "pending",
          message: "GET /api/abonnements",
        },
        {
          id: "abonnements-2",
          name: "Création de plan",
          category: "abonnements",
          status: "pending",
          message: "POST /api/abonnements",
        },
        {
          id: "abonnements-3",
          name: "Souscription utilisateur",
          category: "abonnements",
          status: "pending",
          message: "POST /api/abonnements/subscribe",
        },
        {
          id: "abonnements-4",
          name: "Calcul expiration",
          category: "abonnements",
          status: "pending",
          message: "Date fin + statut actif",
        },
      ],
    },
    {
      id: "domiciliation",
      name: "Domiciliation",
      icon: FileText,
      description: "Tests du workflow de domiciliation",
      tests: [
        {
          id: "domiciliation-1",
          name: "Création demande",
          category: "domiciliation",
          status: "pending",
          message: "POST /api/domiciliations",
        },
        {
          id: "domiciliation-2",
          name: "Workflow de statuts",
          category: "domiciliation",
          status: "pending",
          message: "Transitions de statut",
        },
        {
          id: "domiciliation-3",
          name: "Upload documents",
          category: "domiciliation",
          status: "pending",
          message: "POST /api/domiciliations/:id/documents",
        },
        {
          id: "domiciliation-4",
          name: "Gestion courrier",
          category: "domiciliation",
          status: "pending",
          message: "Ajout et notification courrier",
        },
      ],
    },
    {
      id: "promo",
      name: "Codes Promo & Parrainage",
      icon: TrendingUp,
      description: "Tests des promotions",
      tests: [
        {
          id: "promo-1",
          name: "Création code promo",
          category: "promo",
          status: "pending",
          message: "POST /api/codes-promo",
        },
        {
          id: "promo-2",
          name: "Validation code",
          category: "promo",
          status: "pending",
          message: "Vérification conditions",
        },
        {
          id: "promo-3",
          name: "Application réduction",
          category: "promo",
          status: "pending",
          message: "Calcul montant",
        },
        {
          id: "promo-4",
          name: "Parrainage",
          category: "promo",
          status: "pending",
          message: "Génération code + attribution",
        },
      ],
    },
    {
      id: "database",
      name: "Base de Données",
      icon: Database,
      description: "Tests de la base MySQL",
      tests: [
        {
          id: "database-1",
          name: "Connexion MySQL",
          category: "database",
          status: "pending",
          message: "Test connexion BD",
        },
        {
          id: "database-2",
          name: "Intégrité des tables",
          category: "database",
          status: "pending",
          message: "Foreign keys et contraintes",
        },
        {
          id: "database-3",
          name: "Triggers automatiques",
          category: "database",
          status: "pending",
          message: "Codes promo, notifications",
        },
        {
          id: "database-4",
          name: "Performance requêtes",
          category: "database",
          status: "pending",
          message: "Temps de réponse < 100ms",
        },
      ],
    },
    {
      id: "api",
      name: "API Backend",
      icon: Server,
      description: "Tests de l'API PHP",
      tests: [
        {
          id: "api-1",
          name: "Health check",
          category: "api",
          status: "pending",
          message: "GET /api/health",
        },
        {
          id: "api-2",
          name: "Gestion des erreurs",
          category: "api",
          status: "pending",
          message: "Codes HTTP corrects",
        },
        {
          id: "api-3",
          name: "Rate limiting",
          category: "api",
          status: "pending",
          message: "Protection endpoints",
        },
        {
          id: "api-4",
          name: "CORS Headers",
          category: "api",
          status: "pending",
          message: "Configuration CORS",
        },
      ],
    },
    {
      id: "email",
      name: "Notifications Email",
      icon: Mail,
      description: "Tests du système email",
      tests: [
        {
          id: "email-1",
          name: "Configuration SMTP",
          category: "email",
          status: "pending",
          message: "Connexion serveur email",
        },
        {
          id: "email-2",
          name: "Email bienvenue",
          category: "email",
          status: "pending",
          message: "Template inscription",
        },
        {
          id: "email-3",
          name: "Email réservation",
          category: "email",
          status: "pending",
          message: "Template confirmation",
        },
        {
          id: "email-4",
          name: "Email domiciliation",
          category: "email",
          status: "pending",
          message: "Template workflow",
        },
      ],
    },
  ];

  const allTests = categories.flatMap((cat) => cat.tests);

  const updateTestResult = (testId: string, updates: Partial<TestResult>) => {
    setTestResults((prev) => {
      const existing = prev.find((t) => t.id === testId);
      if (existing) {
        return prev.map((t) => (t.id === testId ? { ...t, ...updates } : t));
      }
      const test = allTests.find((t) => t.id === testId);
      if (test) {
        return [...prev, { ...test, ...updates }];
      }
      return prev;
    });
  };

  const runSingleTest = async (test: TestResult) => {
    setRunningTestId(test.id);
    updateTestResult(test.id, { status: "running" });
    const startTime = Date.now();

    try {
      const response = await apiClient.post("/admin/tests/run", {
        testId: test.id,
        category: test.category,
      }) as unknown as Record<string, unknown>;

      const duration = Date.now() - startTime;

      if (response.success) {
        updateTestResult(test.id, {
          status: "success",
          message: (response.message as string) || "Test réussi",
          duration,
          details: response.details as string,
        });
      } else {
        updateTestResult(test.id, {
          status: "error",
          message: (response.error as string) || "Test échoué",
          duration,
          details: response.details as string,
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(test.id, {
        status: "error",
        message: error.message || "Erreur d'exécution",
        duration,
        details: error.response?.data?.details || error.stack,
      });
    }

    setRunningTestId(null);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setSelectedCategory(null);
    setStartTime(new Date());
    setTestResults([]);
    setGlobalProgress(0);

    const testsToRun = allTests;
    let completed = 0;

    for (const test of testsToRun) {
      await runSingleTest(test);
      completed++;
      setGlobalProgress(Math.round((completed / testsToRun.length) * 100));
    }

    setEndTime(new Date());
    setIsRunning(false);
    toast.success("Tests terminés");
  };

  const runCategoryTests = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsRunning(true);
    setStartTime(new Date());
    setTestResults((prev) => prev.filter((t) => t.category !== categoryId));
    setGlobalProgress(0);

    const testsToRun = allTests.filter((t) => t.category === categoryId);
    let completed = 0;

    for (const test of testsToRun) {
      await runSingleTest(test);
      completed++;
      setGlobalProgress(Math.round((completed / testsToRun.length) * 100));
    }

    setEndTime(new Date());
    setIsRunning(false);
    toast.success(`Tests ${categoryId} terminés`);
  };

  const getResultsByCategory = (categoryId: string) => {
    return testResults.filter((t) => t.category === categoryId);
  };

  const getCategoryStats = (categoryId: string) => {
    const results = getResultsByCategory(categoryId);
    return {
      total: results.length,
      success: results.filter((t) => t.status === "success").length,
      error: results.filter((t) => t.status === "error").length,
      warning: results.filter((t) => t.status === "warning").length,
    };
  };

  const globalStats = {
    total: testResults.length,
    success: testResults.filter((t) => t.status === "success").length,
    error: testResults.filter((t) => t.status === "error").length,
    warning: testResults.filter((t) => t.status === "warning").length,
  };

  const successRate =
    testResults.length > 0
      ? Math.round((globalStats.success / testResults.length) * 100)
      : 0;

  const exportReport = () => {
    const report = {
      date: new Date().toISOString(),
      startTime,
      endTime,
      duration: endTime && startTime ? endTime.getTime() - startTime.getTime() : 0,
      stats: globalStats,
      successRate,
      tests: testResults,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coffice-test-report-${formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport exporté");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-7 h-7 text-amber-500" />
            Tests Système
          </h1>
          <p className="text-gray-600 mt-1">
            Vérification complète de toutes les fonctionnalités
          </p>
        </div>
        <div className="flex gap-2">
          {testResults.length > 0 && (
            <Button variant="outline" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
          <Button
            onClick={() => runAllTests()}
            disabled={isRunning}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isRunning ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Tout tester
              </>
            )}
          </Button>
        </div>
      </div>

      {isRunning && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Tests en cours...
            </span>
            <span className="text-sm font-bold text-amber-600">
              {globalProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </Card>
      )}

      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests exécutés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {globalStats.total}
                </p>
              </div>
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réussis</p>
                <p className="text-2xl font-bold text-green-600">
                  {globalStats.success}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Échoués</p>
                <p className="text-2xl font-bold text-red-600">
                  {globalStats.error}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de réussite</p>
                <p className="text-2xl font-bold text-amber-600">
                  {successRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          const stats = getCategoryStats(category.id);
          const hasResults = stats.total > 0;

          return (
            <Card key={category.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runCategoryTests(category.id)}
                  disabled={isRunning}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Test
                </Button>
              </div>

              {hasResults && (
                <div className="flex gap-2 mb-4">
                  {stats.success > 0 && (
                    <Badge variant="success" className="text-xs">
                      {stats.success} réussis
                    </Badge>
                  )}
                  {stats.error > 0 && (
                    <Badge variant="error" className="text-xs">
                      {stats.error} échoués
                    </Badge>
                  )}
                  {stats.warning > 0 && (
                    <Badge variant="warning" className="text-xs">
                      {stats.warning} warnings
                    </Badge>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {category.tests.map((test) => {
                  const result = testResults.find((r) => r.id === test.id);
                  const isRunningThis = runningTestId === test.id;

                  return (
                    <div
                      key={test.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        result?.status === "success"
                          ? "bg-green-50 border-green-200"
                          : result?.status === "error"
                          ? "bg-red-50 border-red-200"
                          : result?.status === "warning"
                          ? "bg-amber-50 border-amber-200"
                          : isRunningThis
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isRunningThis && (
                              <Loader className="w-3 h-3 text-blue-500 animate-spin" />
                            )}
                            {result?.status === "success" && (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            )}
                            {result?.status === "error" && (
                              <XCircle className="w-3 h-3 text-red-600" />
                            )}
                            {result?.status === "warning" && (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            <p className="text-sm font-medium text-gray-900">
                              {test.name}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {result?.message || test.message}
                          </p>
                          {result?.duration && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {result.duration}ms
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {startTime && endTime && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Résumé de l'exécution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Début</p>
              <p className="font-medium">{formatDate(startTime)}</p>
            </div>
            <div>
              <p className="text-gray-600">Fin</p>
              <p className="font-medium">{formatDate(endTime)}</p>
            </div>
            <div>
              <p className="text-gray-600">Durée totale</p>
              <p className="font-medium">
                {Math.round((endTime.getTime() - startTime.getTime()) / 1000)}s
              </p>
            </div>
            <div>
              <p className="text-gray-600">Score de santé</p>
              <p
                className={`font-bold ${
                  successRate >= 90
                    ? "text-green-600"
                    : successRate >= 70
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {successRate >= 90 ? "Excellent" : successRate >= 70 ? "Bon" : "À améliorer"}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SystemTests;

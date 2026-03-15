import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Check,
  Star,
  Calendar,
  Clock,
  Info,
  Zap,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  FileText,
  CheckCircle,
  Loader2,
  Package,
  Shield,
} from "lucide-react";
import { apiClient } from "../../lib/api-client";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { logger } from "../../utils/logger";
import { useAuthStore } from "../../store/authStore";
import DatePicker, { registerLocale } from "react-datepicker";
import { fr } from "date-fns/locale";
import { format, addMonths } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("fr", fr);

interface Abonnement {
  id: string;
  nom: string;
  description: string;
  prix: number;
  dureeMois: number;
  typeAbonnement: string;
  avantages: string[];
  actif: boolean;
  populaire: boolean;
  ordre: number;
}

const steps = [
  { id: 1, title: "Sélection", icon: Package },
  { id: 2, title: "Informations", icon: User },
  { id: 3, title: "Récapitulatif", icon: FileText },
  { id: 4, title: "Confirmation", icon: CheckCircle },
];

const Abonnements = () => {
  const { user } = useAuthStore();
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbonnement, setSelectedAbonnement] = useState<Abonnement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    entreprise: "",
    dateDebutSouhaitee: null as Date | null,
    commentaire: "",
    acceptConditions: false,
  });

  useEffect(() => {
    loadAbonnements();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "",
      }));
    }
  }, [user]);

  const loadAbonnements = async () => {
    try {
      const response = await apiClient.getAbonnements();
      if (response.success && response.data) {
        const abonnementsData = Array.isArray(response.data) ? response.data : [];
        const formatted: Abonnement[] = abonnementsData.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          nom: a.nom as string,
          description: (a.description as string) || "",
          prix: parseFloat(a.prix as string) || 0,
          dureeMois: parseInt(a.duree_mois as string) || 1,
          typeAbonnement: (a.type_abonnement as string) || "standard",
          avantages: Array.isArray(a.avantages) ? (a.avantages as string[]) : [],
          actif: a.actif === 1 || a.actif === true,
          populaire: a.populaire === 1 || a.populaire === true,
          ordre: parseInt(a.ordre as string) || 0,
        }));
        setAbonnements(formatted.filter((a) => a.actif));
      }
    } catch (error) {
      logger.error("Erreur chargement abonnements:", error instanceof Error ? error.message : String(error));
      toast.error("Erreur lors du chargement des abonnements");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAbonnement = (abonnement: Abonnement) => {
    setSelectedAbonnement(abonnement);
    setShowModal(true);
    setCurrentStep(1);
    setErrors({});
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis";
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.dateDebutSouhaitee) {
      newErrors.dateDebutSouhaitee = "La date de début est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    if (!formData.acceptConditions) {
      toast.error("Veuillez accepter les conditions générales");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const confirmSubscription = async () => {
    if (!selectedAbonnement) return;

    setSubscribing(true);
    try {
      const payload = {
        abonnement_id: selectedAbonnement.id,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        entreprise: formData.entreprise || undefined,
        date_debut_souhaitee: formData.dateDebutSouhaitee
          ? format(formData.dateDebutSouhaitee, "yyyy-MM-dd")
          : undefined,
        commentaire: formData.commentaire || undefined,
      };

      const response = await apiClient.souscrireAbonnement(payload);

      if (response.success) {
        toast.success("Demande d'abonnement envoyée ! Vous recevrez un email de confirmation.");
        setCurrentStep(4);
      } else {
        toast.error(response.error || "Erreur lors de la souscription");
      }
    } catch {
      toast.error("Erreur lors de la souscription");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAbonnement(null);
    setCurrentStep(1);
    setErrors({});
    setFormData(prev => ({
      ...prev,
      entreprise: "",
      dateDebutSouhaitee: null,
      commentaire: "",
      acceptConditions: false,
    }));
  };

  const getDureeText = (dureeMois: number) => {
    if (dureeMois >= 12 && dureeMois % 12 === 0) return `${dureeMois / 12} an${dureeMois / 12 > 1 ? "s" : ""}`;
    return `${dureeMois} mois`;
  };

  const getEndDate = () => {
    if (!formData.dateDebutSouhaitee || !selectedAbonnement) return null;
    return addMonths(formData.dateDebutSouhaitee, selectedAbonnement.dureeMois);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Abonnements</h1>
        <p className="text-gray-600 mt-1">Choisissez l'abonnement qui vous convient</p>
      </div>

      {abonnements.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun abonnement disponible</h3>
          <p className="text-gray-600">Les abonnements seront bientôt disponibles</p>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {abonnements.map((abonnement, index) => (
            <motion.div
              key={abonnement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative p-6 h-full flex flex-col ${
                  abonnement.populaire
                    ? "border-2 border-amber-500 shadow-lg shadow-amber-500/10"
                    : "border border-gray-200"
                }`}
              >
                {abonnement.populaire && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="success" className="px-4 py-1 bg-amber-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Populaire
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{abonnement.nom}</h3>
                  {abonnement.description && (
                    <p className="text-sm text-gray-600">{abonnement.description}</p>
                  )}
                </div>

                <div className="text-center mb-6 pb-6 border-b">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {abonnement.prix.toLocaleString()}
                    </span>
                    <span className="text-gray-600 text-lg">DA</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{getDureeText(abonnement.dureeMois)}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-6">
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-amber-500 mt-0.5" />
                    <span>Durée : {getDureeText(abonnement.dureeMois)}</span>
                  </div>

                  {abonnement.avantages.length > 0 && (
                    <div className="space-y-3">
                      {abonnement.avantages.map((avantage, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{avantage}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSelectAbonnement(abonnement)}
                  className={`w-full ${
                    abonnement.populaire
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Souscrire
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">Informations importantes</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Les abonnements sont renouvelables à la fin de la période
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Accès à tous les espaces selon votre formule
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Contactez l'administration pour toute question
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={currentStep === 4 ? handleCloseModal : () => {
          if (!subscribing) handleCloseModal();
        }}
        title={currentStep === 4 ? "Demande envoyée" : "Souscrire à un abonnement"}
      >
        {selectedAbonnement && (
          <div className="space-y-6">
            {currentStep < 4 && (
              <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
                {steps.slice(0, 3).map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          currentStep >= step.id
                            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] mt-2 font-medium ${
                        currentStep >= step.id ? "text-amber-600" : "text-gray-400"
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full min-w-[20px] ${
                        currentStep > step.id ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gray-200"
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{selectedAbonnement.nom}</h3>
                        {selectedAbonnement.description && (
                          <p className="text-sm text-gray-600 mt-1">{selectedAbonnement.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {selectedAbonnement.prix.toLocaleString()}
                        </span>
                        <span className="text-gray-600">DA</span>
                        <span className="text-sm text-gray-500">
                          / {getDureeText(selectedAbonnement.dureeMois)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedAbonnement.avantages.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-3">Avantages inclus :</h4>
                      <div className="space-y-2">
                        {selectedAbonnement.avantages.map((avantage, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>{avantage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Garantie satisfaction</p>
                        <p>Si vous n'êtes pas satisfait, contactez-nous dans les 7 premiers jours.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-500" />
                    Vos informations
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Nom"
                        icon={<User className="w-5 h-5" />}
                        value={formData.nom}
                        onChange={(e) => {
                          setFormData({ ...formData, nom: e.target.value });
                          if (errors.nom) setErrors({ ...errors, nom: "" });
                        }}
                        className={errors.nom ? "border-red-500" : ""}
                      />
                      {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                    </div>
                    <div>
                      <Input
                        label="Prénom"
                        icon={<User className="w-5 h-5" />}
                        value={formData.prenom}
                        onChange={(e) => {
                          setFormData({ ...formData, prenom: e.target.value });
                          if (errors.prenom) setErrors({ ...errors, prenom: "" });
                        }}
                        className={errors.prenom ? "border-red-500" : ""}
                      />
                      {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Email"
                        type="email"
                        icon={<Mail className="w-5 h-5" />}
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: "" });
                        }}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <Input
                      label="Téléphone"
                      icon={<Phone className="w-5 h-5" />}
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="+213 XXX XX XX XX"
                    />
                  </div>

                  <Input
                    label="Entreprise (optionnel)"
                    icon={<Building className="w-5 h-5" />}
                    value={formData.entreprise}
                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                    placeholder="Nom de votre entreprise"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début souhaitée <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={formData.dateDebutSouhaitee as Date | null}
                      onChange={(date: Date | null) => {
                        setFormData({ ...formData, dateDebutSouhaitee: date });
                        if (errors.dateDebutSouhaitee) setErrors({ ...errors, dateDebutSouhaitee: "" });
                      }}
                      minDate={new Date()}
                      locale="fr"
                      dateFormat="dd MMMM yyyy"
                      placeholderText="Sélectionnez une date"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        errors.dateDebutSouhaitee ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {errors.dateDebutSouhaitee && (
                      <p className="text-red-500 text-sm mt-1">{errors.dateDebutSouhaitee}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commentaire (optionnel)
                    </label>
                    <textarea
                      value={formData.commentaire}
                      onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                      placeholder="Des besoins particuliers ?"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    Récapitulatif de votre demande
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-500" />
                        Abonnement sélectionné
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">{selectedAbonnement.nom}</span>
                        <span className="font-bold text-gray-900">
                          {selectedAbonnement.prix.toLocaleString()} DA
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Durée : {getDureeText(selectedAbonnement.dureeMois)}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        Vos informations
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Nom complet :</span>
                          <p className="font-medium text-gray-900">{formData.prenom} {formData.nom}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email :</span>
                          <p className="font-medium text-gray-900">{formData.email}</p>
                        </div>
                        {formData.telephone && (
                          <div>
                            <span className="text-gray-500">Téléphone :</span>
                            <p className="font-medium text-gray-900">{formData.telephone}</p>
                          </div>
                        )}
                        {formData.entreprise && (
                          <div>
                            <span className="text-gray-500">Entreprise :</span>
                            <p className="font-medium text-gray-900">{formData.entreprise}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        Période
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Début :</span>
                          <p className="font-medium text-gray-900">
                            {formData.dateDebutSouhaitee
                              ? format(formData.dateDebutSouhaitee, "dd MMMM yyyy", { locale: fr })
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Fin prévue :</span>
                          <p className="font-medium text-gray-900">
                            {getEndDate()
                              ? format(getEndDate()!, "dd MMMM yyyy", { locale: fr })
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.acceptConditions}
                      onChange={(e) => setFormData({ ...formData, acceptConditions: e.target.checked })}
                      className="w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      J'accepte les conditions générales d'utilisation et la politique de confidentialité de Coffice
                    </span>
                  </label>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-700">
                        <p className="font-medium mb-1">Prochaines étapes :</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Votre demande sera envoyée à notre équipe</li>
                          <li>Vous recevrez un email avec les modalités de paiement</li>
                          <li>Votre abonnement sera activé après confirmation du paiement</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h3>
                  <p className="text-gray-600 mb-6">
                    Votre demande d'abonnement a été envoyée avec succès. Nous vous contacterons prochainement.
                  </p>

                  <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Récapitulatif :</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Abonnement :</strong> {selectedAbonnement.nom}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Montant :</strong> {selectedAbonnement.prix.toLocaleString()} DA
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Email de confirmation :</strong> {formData.email}
                    </p>
                  </div>

                  <Button onClick={handleCloseModal} className="bg-gray-900 hover:bg-gray-800">
                    Fermer
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {currentStep < 4 && (
              <div className="flex justify-between gap-3 pt-4 border-t">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} disabled={subscribing}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Précédent
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={confirmSubscription}
                    disabled={subscribing || !formData.acceptConditions}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
                  >
                    {subscribing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Envoi...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Confirmer
                      </span>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Abonnements;

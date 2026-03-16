import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, User, Phone, ArrowRight, Gift, Building, Briefcase, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Input, PasswordInput, Button, Checkbox, GoogleButton } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { UserForm } from "../types";
import { apiClient } from "../lib/api-client";
import { validationRules } from "../utils/validation";
import Logo from "../components/Logo";
import { useSEO } from "../hooks/useSEO";

interface RegisterForm extends UserForm {
  passwordConfirm?: string;
  acceptTerms: boolean;
}

const BENEFITS = [
  "Reservez des espaces de travail en quelques clics",
  "Gerez vos reservations et abonnements",
  "Demandez une domiciliation legale en ligne",
  "Recevez et suivez votre courrier professionnel",
];

const Register = () => {
  useSEO({ noIndex: true });
  const { register: registerUser, loginWithGoogle, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [validatingReferral, setValidatingReferral] = React.useState(false);
  const [referralValid, setReferralValid] = React.useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch("password");

  const validateReferralCode = React.useCallback(async (code: string) => {
    if (!code || code.trim().length < 3) {
      setReferralValid(null);
      return;
    }

    setValidatingReferral(true);
    try {
      const result = await apiClient.verifyCodeParrainage(code.trim());
      setReferralValid(result.success);
      if (result.success) {
        toast.success("Code de parrainage valide ! Vous recevrez 3000 DA");
      } else {
        toast.error(result.error || "Code de parrainage invalide");
      }
    } catch {
      setReferralValid(false);
    } finally {
      setValidatingReferral(false);
    }
  }, []);

  React.useEffect(() => {
    const referralCode = searchParams.get("parrain");
    if (referralCode) {
      const code = referralCode.toUpperCase();
      setValue("codeParrainage", code);
      validateReferralCode(code);
    }
  }, [searchParams, setValue, validateReferralCode]);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        profession: data.profession,
        entreprise: data.entreprise,
        codeParrainage: data.codeParrainage,
      });
    } catch {
      // handled by authStore
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
    } catch {
      // handled by authStore
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/salle-reunion.jpeg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link to="/">
              <Logo variant="light" className="h-10" />
            </Link>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-white leading-tight">
                Rejoignez
                <br />
                Coffice
              </h1>
              <p className="mt-4 text-white/80 text-lg leading-relaxed max-w-md">
                Creez votre compte et accedez a un espace de travail moderne au
                coeur d'Alger.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {BENEFITS.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white/90 text-sm">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="text-white/50 text-sm">
            Mohammadia Mall, 4eme etage, Alger
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start lg:items-center justify-center p-6 sm:p-8 bg-gray-50/50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[520px] py-8 lg:py-4"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block">
              <Logo className="h-12 mx-auto" />
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Creer votre compte
            </h2>
            <p className="mt-2 text-gray-500">
              Inscrivez-vous pour commencer a utiliser Coffice
            </p>
          </div>

          <GoogleButton
            onSuccess={handleGoogleSuccess}
            text="S'inscrire avec Google"
            loading={isGoogleLoading}
          />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gray-50/50 text-gray-400 text-sm">ou avec email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prenom"
                icon={<User className="w-5 h-5" />}
                placeholder="Prenom"
                autoComplete="given-name"
                {...register("prenom", validationRules.prenom)}
                error={errors.prenom?.message}
                required
              />
              <Input
                label="Nom"
                icon={<User className="w-5 h-5" />}
                placeholder="Nom"
                autoComplete="family-name"
                {...register("nom", validationRules.nom)}
                error={errors.nom?.message}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-5 h-5" />}
              placeholder="votre@email.com"
              autoComplete="email"
              {...register("email", validationRules.email)}
              error={errors.email?.message}
              required
            />

            <Input
              label="Telephone"
              type="tel"
              icon={<Phone className="w-5 h-5" />}
              placeholder="+213 55 123 4567"
              autoComplete="tel"
              helperText="Format: +213 ou 0 suivi de 9 chiffres"
              {...register("telephone", {
                ...validationRules.phone,
                validate: (value: string | undefined) =>
                  !value || validationRules.phone.validate(value),
              })}
              error={errors.telephone?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Entreprise"
                icon={<Building className="w-5 h-5" />}
                placeholder="Nom de votre entreprise"
                autoComplete="organization"
                {...register("entreprise")}
                error={errors.entreprise?.message}
              />
              <Input
                label="Profession"
                icon={<Briefcase className="w-5 h-5" />}
                placeholder="Votre profession"
                autoComplete="organization-title"
                {...register("profession")}
                error={errors.profession?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                label="Mot de passe"
                placeholder="Min. 8 caracteres"
                autoComplete="new-password"
                showStrength
                {...register("password", validationRules.password)}
                error={errors.password?.message}
                required
              />
              <PasswordInput
                label="Confirmer"
                placeholder="Retapez le mot de passe"
                autoComplete="new-password"
                {...register("passwordConfirm", validationRules.passwordConfirm(password))}
                error={errors.passwordConfirm?.message}
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Code de parrainage (optionnel)"
                type="text"
                icon={<Gift className="w-5 h-5" />}
                placeholder="COFFICE-AHM123"
                helperText="Entrez le code d'un ami pour recevoir un bonus de 3000 DA"
                {...register("codeParrainage", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value.toUpperCase();
                    setValue("codeParrainage", value);
                    if (!value) setReferralValid(null);
                  },
                  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                    const value = e.target.value.toUpperCase();
                    if (value) validateReferralCode(value);
                  },
                })}
                rightElement={
                  validatingReferral ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                  ) : referralValid === true ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : referralValid === false ? (
                    <span className="text-red-500 text-xs font-medium">Invalide</span>
                  ) : null
                }
              />
              {referralValid === true && (
                <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                  Code valide - Bonus de 3000 DA a votre premiere reservation
                </p>
              )}
            </div>

            <Checkbox
              label={
                <span className="text-sm text-gray-600">
                  J'accepte les{" "}
                  <Link
                    to="/mentions-legales"
                    className="text-accent hover:text-accent-dark font-medium"
                  >
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link
                    to="/mentions-legales"
                    className="text-accent hover:text-accent-dark font-medium"
                  >
                    politique de confidentialite
                  </Link>
                </span>
              }
              {...register("acceptTerms", validationRules.acceptTerms)}
              error={errors.acceptTerms?.message}
              required
            />

            <Button type="submit" loading={isLoading} className="w-full" size="lg">
              Creer mon compte
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Deja un compte ?{" "}
            <Link
              to="/connexion"
              className="text-accent font-semibold hover:text-accent-dark transition-colors"
            >
              Se connecter
            </Link>
          </p>

          <div className="lg:hidden text-center mt-6">
            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Retour a l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, User, Phone, ArrowRight, Gift, Building, Briefcase } from "lucide-react";
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

const Register = () => {
  useSEO({ noIndex: true });
  const { register: registerUser, loginWithGoogle, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [validatingReferral, setValidatingReferral] = React.useState(false);
  const [referralValid, setReferralValid] = React.useState<boolean | null>(
    null,
  );

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
      // error is already handled by authStore toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
    } catch {
      // error is already handled by authStore toast
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo className="h-16 mx-auto" />
          </Link>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-display font-bold text-primary mb-2 text-center">
            Inscription
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Créez votre compte Coffice
          </p>

          <GoogleButton
            onSuccess={handleGoogleSuccess}
            text="S'inscrire avec Google"
            loading={isGoogleLoading}
          />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou avec email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                icon={<User className="w-5 h-5" />}
                placeholder="Prénom"
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
              label="Téléphone"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <PasswordInput
              label="Mot de passe"
              placeholder="••••••••"
              autoComplete="new-password"
              showStrength
              {...register("password", validationRules.password)}
              error={errors.password?.message}
              required
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("passwordConfirm", validationRules.passwordConfirm(password))}
              error={errors.passwordConfirm?.message}
              required
            />

            <div className="relative">
              <Input
                label="Code de parrainage (optionnel)"
                type="text"
                icon={<Gift className="w-5 h-5" />}
                placeholder="COFFICE-AHM123"
                helperText="Entrez le code de parrainage de votre ami pour bénéficier d'un bonus"
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
                    <span className="text-green-600 text-xs font-medium">✓ Valide</span>
                  ) : referralValid === false ? (
                    <span className="text-red-600 text-xs font-medium">✗ Invalide</span>
                  ) : null
                }
              />
              {referralValid === true && (
                <p className="text-sm text-green-600 mt-2">
                  Code valide - Bonus de 3000 DA à votre première réservation
                </p>
              )}
            </div>

            <Checkbox
              label={
                <span className="text-sm text-gray-700">
                  J'accepte les{" "}
                  <Link
                    to="/mentions-legales"
                    className="text-accent hover:text-accent/80 font-medium"
                  >
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link
                    to="/mentions-legales"
                    className="text-accent hover:text-accent/80 font-medium"
                  >
                    politique de confidentialité
                  </Link>
                </span>
              }
              {...register("acceptTerms", validationRules.acceptTerms)}
              error={errors.acceptTerms?.message}
              required
            />

            <Button type="submit" loading={isLoading} className="w-full">
              Créer mon compte
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{" "}
              <Link
                to="/connexion"
                className="text-accent hover:text-accent/80 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-600 hover:text-primary transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Coffee, Wifi, Users, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Input, PasswordInput, Button, Checkbox, GoogleButton } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { validationRules } from "../utils/validation";
import Logo from "../components/Logo";
import { useSEO } from "../hooks/useSEO";

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const FEATURES = [
  { icon: Coffee, text: "Espaces de travail premium" },
  { icon: Wifi, text: "Connexion haut debit" },
  { icon: Users, text: "Communaute professionnelle" },
  { icon: Shield, text: "Domiciliation legale" },
];

const Login = () => {
  useSEO({ noIndex: true });
  const navigate = useNavigate();
  const { login, loginWithGoogle, user } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_expired") === "1") {
      toast.error("Votre session a expiré. Veuillez vous reconnecter.");
      window.history.replaceState({}, "", "/connexion");
    }
  }, []);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      if (!data.rememberMe) {
        sessionStorage.setItem("coffice-session-only", "1");
      } else {
        sessionStorage.removeItem("coffice-session-only");
      }
      await login(data.email, data.password);
      navigate("/app");
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
      navigate("/app");
    } catch {
      // handled by authStore
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/espace-coworking.jpeg)" }}
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
                Votre espace de
                <br />
                travail ideal
              </h1>
              <p className="mt-4 text-white/80 text-lg leading-relaxed max-w-md">
                Rejoignez une communaute de professionnels et entrepreneurs au
                coeur d'Alger.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              {FEATURES.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-[18px] h-[18px] text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="text-white/50 text-sm">
            Mohammadia Mall, 4eme etage, Alger
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block">
              <Logo className="h-12 mx-auto" />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Bon retour parmi nous
            </h2>
            <p className="mt-2 text-gray-500">
              Connectez-vous pour acceder a votre espace
            </p>
          </div>

          <GoogleButton
            onSuccess={handleGoogleSuccess}
            loading={isGoogleLoading}
          />

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gray-50/50 text-gray-400 text-sm">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Adresse email"
              type="email"
              icon={<Mail className="w-5 h-5" />}
              placeholder="votre@email.com"
              autoComplete="email"
              {...register("email", validationRules.email)}
              error={errors.email?.message}
            />

            <div>
              <PasswordInput
                label="Mot de passe"
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                {...register("password", validationRules.password)}
                error={errors.password?.message}
              />
            </div>

            <div className="flex items-center justify-between">
              <Checkbox
                label="Se souvenir de moi"
                {...register("rememberMe")}
              />
              <Link
                to="/mot-de-passe-oublie"
                className="text-sm font-medium text-accent hover:text-accent-dark transition-colors"
              >
                Mot de passe oublie ?
              </Link>
            </div>

            <Button type="submit" loading={isLoading} className="w-full" size="lg">
              Se connecter
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Pas encore de compte ?{" "}
            <Link
              to="/inscription"
              className="text-accent font-semibold hover:text-accent-dark transition-colors"
            >
              Creer un compte
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

export default Login;

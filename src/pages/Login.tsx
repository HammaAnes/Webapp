import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Input, PasswordInput, Button, Checkbox, GoogleLoginButton } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { validationRules } from "../utils/validation";
import Logo from "../components/Logo";

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, user } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  // Vérifier si l'utilisateur arrive après une session expirée
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_expired") === "1") {
      toast.error("Votre session a expiré. Veuillez vous reconnecter.");
      // Nettoyer l'URL
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
      // error is already handled by authStore toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(idToken);
      navigate("/app");
    } catch {
      // error is already handled by authStore toast
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    toast.error(error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo className="h-16 mx-auto" />
          </Link>
        </div>

        {/* Form */}
        <div className="card p-8">
          <h2 className="text-2xl font-display font-bold text-primary mb-2 text-center">
            Connexion
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Accédez à votre espace membre
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-5 h-5" />}
              placeholder="votre@email.com"
              autoComplete="email"
              {...register("email", validationRules.email)}
              error={errors.email?.message}
            />

            <PasswordInput
              label="Mot de passe"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password", validationRules.password)}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between">
              <Checkbox
                label="Se souvenir de moi"
                {...register("rememberMe")}
              />
              <Link to="/mot-de-passe-oublie" className="text-sm text-accent hover:text-accent/80">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">
              Se connecter
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou</span>
            </div>
          </div>

          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            loading={isGoogleLoading}
          />

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Pas encore de compte ?{" "}
              <Link
                to="/inscription"
                className="text-accent hover:text-accent/80 font-medium"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
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

export default Login;

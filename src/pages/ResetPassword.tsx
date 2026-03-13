import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PasswordInput, Button, LoadingSpinner } from '../components/ui';
import { apiClient } from '../lib/api-client';
import { validationRules } from '../utils/validation';
import Logo from '../components/Logo';
import { useSEO } from '../hooks/useSEO';

interface ResetPasswordForm {
  password: string;
  passwordConfirm: string;
}

export default function ResetPassword() {
  useSEO({ noIndex: true });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = React.useState(true);
  const [isValidToken, setIsValidToken] = React.useState(false);
  const [error, setError] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  React.useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setError('Token manquant');
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await apiClient.get(`/auth/verify-reset-token.php?token=${token}`);
      setIsValidToken(true);
      const rd = response.data as Record<string, any>;
      const inner = rd?.data as Record<string, any>;
      setEmail(inner?.email as string || '');
    } catch (err) {
      setIsValidToken(false);
      const message = err instanceof Error ? err.message : 'Token invalide ou expiré';
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password.php', {
        token,
        password: data.password,
        password_confirmation: data.passwordConfirm,
      });

      toast.success('Mot de passe réinitialisé avec succès !');
      setTimeout(() => navigate('/connexion'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <Logo className="h-16 mx-auto" />
            </Link>
          </div>

          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-display font-bold text-primary mb-4">
              Lien invalide
            </h2>

            <p className="text-gray-600 mb-6">{error}</p>

            <div className="space-y-3">
              <Link to="/mot-de-passe-oublie">
                <Button className="w-full">
                  Demander un nouveau lien
                </Button>
              </Link>
              <Link to="/connexion">
                <Button variant="outline" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo className="h-16 mx-auto" />
          </Link>
        </div>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-display font-bold text-primary mb-2">
              Nouveau mot de passe
            </h2>
            <p className="text-gray-600">
              Créez un nouveau mot de passe pour{' '}
              <strong className="text-primary">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <PasswordInput
              label="Nouveau mot de passe"
              placeholder="••••••••"
              autoComplete="new-password"
              showStrength
              {...register('password', validationRules.password)}
              error={errors.password?.message}
              disabled={isLoading}
              required
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('passwordConfirm', validationRules.passwordConfirm(password))}
              error={errors.passwordConfirm?.message}
              disabled={isLoading}
              required
            />

            <Button type="submit" className="w-full" loading={isLoading}>
              Réinitialiser le mot de passe
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/connexion"
            className="text-gray-600 hover:text-primary transition-colors"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

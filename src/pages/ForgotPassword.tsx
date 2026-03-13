import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Input, Button } from '../components/ui';
import { apiClient } from '../lib/api-client';
import { validationRules } from '../utils/validation';
import Logo from '../components/Logo';
import { useSEO } from '../hooks/useSEO';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPassword() {
  useSEO({ noIndex: true });
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password.php', { email: data.email });
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success('Email envoyé ! Vérifiez votre boîte de réception.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-display font-bold text-primary mb-4">
              Email envoyé
            </h2>

            <p className="text-gray-600 mb-6">
              Si un compte existe avec l'adresse{' '}
              <strong className="text-primary">{submittedEmail}</strong>, vous
              recevrez un lien de réinitialisation dans quelques minutes.
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Vérifiez également votre dossier spam si vous ne voyez pas l'email.
            </p>

            <Link to="/connexion">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
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
          <h2 className="text-2xl font-display font-bold text-primary mb-2 text-center">
            Mot de passe oublié ?
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Entrez votre adresse email et nous vous enverrons un lien pour
            réinitialiser votre mot de passe.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-5 h-5" />}
              placeholder="votre@email.com"
              autoComplete="email"
              {...register('email', validationRules.email)}
              error={errors.email?.message}
              required
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" loading={isLoading}>
              Envoyer le lien de réinitialisation
            </Button>

            <div className="text-center">
              <Link
                to="/connexion"
                className="text-sm text-accent hover:text-accent/80 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          </form>
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
}

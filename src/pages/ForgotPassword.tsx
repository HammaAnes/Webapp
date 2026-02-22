import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ErrorMessage from '../components/ui/ErrorMessage';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post('/auth/forgot-password.php', { email });
      setIsSubmitted(true);
      toast.success('Email envoyé ! Vérifiez votre boîte de réception.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Logo className="mx-auto mb-6" size="lg" />
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé</h2>
              <p className="text-gray-600">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Vérifiez également votre dossier spam si vous ne voyez pas l'email.
              </p>

              <Link to="/connexion" className="block w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors">
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Logo className="mx-auto mb-6" size="lg" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h2>
            <p className="text-gray-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" loading={isLoading}>
              Envoyer le lien de réinitialisation
            </Button>

            <div className="text-center">
              <Link to="/connexion" className="text-sm text-blue-600 hover:text-blue-700">
                Retour à la connexion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

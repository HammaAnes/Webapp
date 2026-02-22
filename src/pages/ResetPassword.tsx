import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ErrorMessage from '../components/ui/ErrorMessage';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
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
      setEmail(inner?.email as string || "");
    } catch (err) {
      setIsValidToken(false);
      const message = err instanceof Error ? err.message : 'Token invalide ou expiré';
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password.php', {
        token,
        password,
        password_confirmation: passwordConfirmation
      });

      toast.success('Mot de passe réinitialisé avec succès !');
      setTimeout(() => navigate('/connexion'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Logo className="mx-auto mb-6" size="lg" />
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h2>
              <p className="text-gray-600 mb-6">{error}</p>

              <div className="space-y-3">
                <Link to="/mot-de-passe-oublie" className="block w-full px-6 py-3 bg-accent text-white rounded-xl font-semibold text-center hover:bg-accent/90 transition-colors">
                  Demander un nouveau lien
                </Link>
                <Link to="/connexion" className="block w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors">
                  Retour a la connexion
                </Link>
              </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h2>
            <p className="text-gray-600">
              Créez un nouveau mot de passe pour <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            <Input
              label="Nouveau mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              required
              disabled={isLoading}
              minLength={6}
            />

            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Retapez votre mot de passe"
              required
              disabled={isLoading}
              minLength={6}
            />

            {password && passwordConfirmation && password !== passwordConfirmation && (
              <p className="text-sm text-red-600">Les mots de passe ne correspondent pas</p>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={password !== passwordConfirmation || password.length < 6}
            >
              Réinitialiser le mot de passe
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

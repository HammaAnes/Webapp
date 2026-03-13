import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Input from './Input';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  showStrength?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label = 'Mot de passe', error, helperText, showStrength = false, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
      if (!password) return { strength: 0, label: '', color: '' };

      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      const levels = [
        { strength: 0, label: '', color: '' },
        { strength: 1, label: 'Très faible', color: 'bg-red-500' },
        { strength: 2, label: 'Faible', color: 'bg-orange-500' },
        { strength: 3, label: 'Moyen', color: 'bg-yellow-500' },
        { strength: 4, label: 'Fort', color: 'bg-green-500' },
        { strength: 5, label: 'Très fort', color: 'bg-green-600' },
      ];

      return levels[strength];
    };

    const passwordStrength = showStrength && value ? getPasswordStrength(value as string) : null;

    return (
      <div className="w-full">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          label={label}
          error={error}
          helperText={helperText}
          icon={<Lock className="w-5 h-5" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
          value={value}
          {...props}
        />
        {passwordStrength && passwordStrength.strength > 0 && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full ${
                    level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600">
              Force: {passwordStrength.label}
            </p>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;

import { useMemo } from 'react';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score === 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' };
    if (score === 4) return { level: 4, label: 'Strong', color: 'bg-green-500' };
    return { level: 5, label: 'Very strong', color: 'bg-green-600' };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2 mb-1">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.level / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.color === 'bg-red-500' ? 'text-red-500' :
          strength.color === 'bg-orange-500' ? 'text-orange-500' :
          strength.color === 'bg-yellow-500' ? 'text-yellow-500' :
          strength.color === 'bg-green-500' ? 'text-green-500' :
          strength.color === 'bg-green-600' ? 'text-green-600' : 'text-gray-500'
        }`}>
          {strength.label}
        </span>
      </div>
    </div>
  );
};

export default PasswordStrength;


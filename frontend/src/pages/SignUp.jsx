import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValid(validateEmail(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error('Please enter a valid email address');
      return;
    }
    // Store email and navigate to verification
    localStorage.setItem('signupEmail', email);
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded flex items-center justify-center mr-2">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Jira</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Get started with Jira</h2>
          <p className="mt-2 text-sm text-gray-600">
            It's free for up to 10 users - no credit card needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Work Email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@company.com"
                value={email}
                onChange={handleEmailChange}
              />
              {isValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Find teammates, plus keep work and life separate by using your work email.
            </p>
          </div>

          <div className="flex items-start">
            <input
              id="agreement"
              name="agreement"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="agreement" className="ml-3 text-sm text-gray-600">
              I agree to the{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Atlassian Customer Agreement
              </a>
              , which incorporates by reference the{' '}
              <a href="#" className="text-primary-600 hover:underline">
                AI Product-Specific Terms
              </a>
              , and acknowledge the{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>
              .
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Sign up
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">G Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Apple</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Microsoft</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Slack</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have Jira?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Login
            </Link>
          </p>
        </form>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center text-primary-600">
            <span className="text-xs">▲</span>
            <span className="ml-1 text-xs font-medium">ATLASSIAN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;


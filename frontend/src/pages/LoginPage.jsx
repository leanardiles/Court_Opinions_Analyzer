import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-cardozo-dark mb-2">
            Court Opinions Analyzer
          </h1>
          <div className="w-16 h-1 bg-cardozo-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Cardozo Law School</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your.email@cardozo.edu"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-3">Test Accounts:</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-900">Admin:</p>
              <div className="flex justify-between text-gray-600 mt-1">
                <span>Email:</span>
                <span>admin@cardozo.edu</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Password:</span>
                <span className="font-mono">admin12345</span>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="font-medium text-gray-900">Validator:</p>
              <div className="flex justify-between text-gray-600 mt-1">
                <span>Email:</span>
                <span>ta1@cardozo.edu</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Password:</span>
                <span className="font-mono">validator123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import * as api from '../api';

interface AuthProps {
  onAuthSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await api.login(email.trim(), password);
        onAuthSuccess(data.token, data.user);
      } else {
        const data = await api.signup(name.trim(), email.trim(), password);
        onAuthSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'An error occurred. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 md:p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl mt-12 transition-all duration-300">
      {/* Brand logo & header */}
      <div className="flex flex-col items-center mb-8 select-none">
        <div className="grid grid-cols-2 gap-[2px] w-8 h-8 p-[2.5px] rounded bg-accent shadow-md mb-3">
          <div className="bg-accent opacity-85 rounded-sm" />
          <div className="bg-accent opacity-50 rounded-sm" />
          <div className="bg-accent opacity-65 rounded-sm" />
          <div className="bg-accent opacity-100 rounded-sm" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          NavDay
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {isLogin ? 'Log in to track your habits daily' : 'Create an account to start tracking'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name (Signup only) */}
        {!isLogin && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Naivedya Sahay"
              className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              required={!isLogin}
            />
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="yourname@example.com"
            className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            required
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-lg shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-6"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isLogin ? (
            'Log In'
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch Link */}
      <div className="text-center mt-6 text-xs text-[var(--text-secondary)]">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setName('');
            setEmail('');
            setPassword('');
          }}
          className="text-accent hover:underline font-semibold cursor-pointer"
        >
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </div>
    </div>
  );
};

export default Auth;

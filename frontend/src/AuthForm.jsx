
import { useState } from 'react';
import { X, BookOpenCheck, ArrowRight } from 'lucide-react';

export default function AuthModal({ mode, onClose, onSuccess, onSwitch }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isRegister = mode === 'register';

      const response = await fetch(
        isRegister ? '/api/auth/register' : '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isRegister ? { name, email, password, role } : { email, password }
          )
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.details?.[0]?.message ||
          'Something went wrong. Please try again.'
        );
      }

      if (isRegister) {
        setError('');
        onSuccess(null, `Account created for ${data.user.name}. You can now log in.`);
      } else {
        onSuccess(data, 'Login successful!');
      }
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the server. Check that the backend is running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="auth-modal" role="dialog" aria-modal="true"
        aria-labelledby="auth-title">
        <button className="auth-close" onClick={onClose}
          aria-label="Close"><X size={20} /></button>

        <div className="auth-brand-mark"><BookOpenCheck size={25} /></div>

        <h2 id="auth-title">
          {mode === 'register' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'register'
            ? 'Choose how you want to use ExamForge.'
            : 'Log in to continue your learning journey.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <label>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)}
                minLength={2} maxLength={100} autoComplete="name"
                placeholder="Enter your name" required />
            </label>
          )}

          {mode === 'register' && (
            <label>Account type
              <select value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="student">Student — take exams and view results</option>
                <option value="creator">Exam Creator — create and publish exams</option>
              </select>
              <small className="auth-subtitle">Creator registration is enabled for this hackathon demo.</small>
            </label>
          )}

          <label>
            Email address
            <input type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254} autoComplete="email"
              placeholder="you@example.com" required />
          </label>

          <label>
            Password
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'register' ? 8 : 1}
              maxLength={72}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
              required />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="btn btn-primary auth-submit" type="submit"
            disabled={loading}>
            {loading ? 'Please wait...' :
              mode === 'register' ? 'Create account' : 'Log in'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'register' ? 'Already have an account?' : 'New to ExamForge?'}
          {' '}
          <button type="button" onClick={onSwitch}>
            {mode === 'register' ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </section>
    </div>
  );
}
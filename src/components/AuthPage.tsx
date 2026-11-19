import { useState, type FormEvent } from 'react';
import { ArrowLeft, Briefcase, GraduationCap, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types/models';
import { validateStudentEmail } from '../utils/domain';

interface AuthPageProps {
  initialRole?: 'business' | 'student';
  onAuthSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
}

export function AuthPage({
  initialRole = 'business',
  onAuthSuccess,
  onNavigate,
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'business' | 'student'>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<'Selaqui' | 'Other Dehradun'>('Selaqui');
  const [industry, setIndustry] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [programBatch, setProgramBatch] = useState('MBA · Batch 2025–27');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && role === 'student' && !validateStudentEmail(email)) {
      setError('DGU students must sign up using a valid @dgu.ac.in email address.');
      return;
    }

    setLoading(true);
    try {
      const user =
        mode === 'login'
          ? await api.login(email, password)
          : await api.signup({
              name,
              email,
              password,
              role,
              businessName,
              phone,
              location,
              industry,
              enrollmentNumber,
              programBatch,
            });
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoRole: 'business' | 'student' | 'admin') {
    setError('');
    setLoading(true);
    try {
      const user = await api.demoLogin(demoRole);
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F2D52] mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to DGU IndustryBridge</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'login'
                  ? 'Access your Business, Student, or Admin portal.'
                  : 'Choose Business or Student role. Admin accounts are set manually.'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-[#0F2D52] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-[#0F2D52] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-1.5">
                    Select Your Role
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('business')}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                        role === 'business'
                          ? 'border-[#0F2D52] bg-blue-50/70 text-[#0F2D52]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" aria-hidden="true" />
                      <span>Business</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                        role === 'student'
                          ? 'border-teal-700 bg-teal-50/70 text-teal-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" aria-hidden="true" />
                      <span>DGU Student</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-name">
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                    placeholder={role === 'business' ? 'Owner or Manager Name' : 'Student Full Name'}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-email">
                {mode === 'signup' && role === 'student'
                  ? 'DGU Email (@dgu.ac.in required)'
                  : 'Email Address'}
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                placeholder={
                  mode === 'signup' && role === 'student'
                    ? 'name.roll@dgu.ac.in'
                    : 'you@company.in'
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D52]"
                placeholder="Minimum 6 characters"
              />
            </div>

            {mode === 'signup' && role === 'business' && (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-biz">
                    Business Name
                  </label>
                  <input
                    id="auth-biz"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    placeholder="e.g. Himalayan Herbs Pvt Ltd"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-loc">
                      Location
                    </label>
                    <select
                      id="auth-loc"
                      value={location}
                      onChange={(e) => setLocation(e.target.value as 'Selaqui' | 'Other Dehradun')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    >
                      <option value="Selaqui">Selaqui</option>
                      <option value="Other Dehradun">Other Dehradun</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-phone">
                      Phone / WhatsApp
                    </label>
                    <input
                      id="auth-phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      placeholder="+91 98..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-ind">
                    Industry
                  </label>
                  <input
                    id="auth-ind"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    placeholder="e.g. Packaging, Pharma, Retail"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && role === 'student' && (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-enr">
                      DGU Enrollment No.
                    </label>
                    <input
                      id="auth-enr"
                      required
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      placeholder="DGU25MBA..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-sphone">
                      Phone / WhatsApp
                    </label>
                    <input
                      id="auth-sphone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      placeholder="+91 90..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="auth-batch">
                    Program &amp; Batch
                  </label>
                  <input
                    id="auth-batch"
                    required
                    value={programBatch}
                    onChange={(e) => setProgramBatch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2D52] rounded-lg hover:bg-[#173f73] transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          {/* Instant Demo Switcher for MVP Walkthrough */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Instant Demo Accounts (Seeded Data)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('business')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#0F2D52]" aria-hidden="true" />
                <span>Demo Business</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('student')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                <GraduationCap className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                <span>Demo Student</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F2D52]" aria-hidden="true" />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

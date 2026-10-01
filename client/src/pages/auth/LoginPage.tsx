import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Role, LoginChallenge } from '../../types/auth';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, initiateLogin, verifyOtp, resendOtp } = useAuth();
  const { showToast } = useToast();

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (user && role) {
      if (role === 'STUDENT') navigate('/today', { replace: true });
      else if (role === 'FACULTY') navigate('/faculty', { replace: true });
      else if (role === 'ADMINISTRATOR') navigate('/admin', { replace: true });
      else if (role === 'CLUB_CORE') navigate('/club/dashboard', { replace: true });
    }
  }, [user, role, navigate]);

  // Form State
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');
  const [email, setEmail] = useState('aarav.sharma@campus.edu');
  const [password, setPassword] = useState('Student@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OTP Challenge State
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Auto-fill demo credentials on role change for smooth demonstration
  const handleRoleChange = (newRole: Role) => {
    setSelectedRole(newRole);
    setErrorMessage(null);
    if (newRole === 'STUDENT') {
      setEmail('aarav.sharma@campus.edu');
      setPassword('Student@123');
    } else if (newRole === 'FACULTY') {
      setEmail('dr.ramanujan@campus.edu');
      setPassword('Faculty@123');
    } else if (newRole === 'ADMINISTRATOR') {
      setEmail('admin@campus.edu');
      setPassword('Admin@123');
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await initiateLogin(email, password, selectedRole);
      setChallenge(result);
      setResendCooldown(60);
      showToast(result.message, 'info', 'Verification Code Sent');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge || otp.length !== 6) return;
    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const authenticatedUser = await verifyOtp(challenge.challengeId, otp);
      showToast(`Welcome back, ${authenticatedUser.fullName}`, 'success', 'Signed In');

      // Navigate to destination
      const destination = (location.state as any)?.from?.pathname;
      if (destination && destination !== '/login') {
        navigate(destination, { replace: true });
      } else {
        if (authenticatedUser.role === 'STUDENT') navigate('/today', { replace: true });
        else if (authenticatedUser.role === 'FACULTY') navigate('/faculty', { replace: true });
        else if (authenticatedUser.role === 'ADMINISTRATOR') navigate('/admin', { replace: true });
        else if (authenticatedUser.role === 'CLUB_CORE') navigate('/club/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.');
      showToast(err.message || 'Verification error', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!challenge || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await resendOtp(challenge.challengeId);
      setResendCooldown(60);
      showToast('A fresh verification code has been sent.', 'info', 'Code Resent');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
      showToast(err.message || 'Resend error', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col justify-between selection:bg-campus-jade-100 selection:text-campus-jade-900">
      {/* Top University Branding Bar */}
      <header className="px-6 py-4 border-b border-campus-borderSubtle flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-campus-jade-700 flex items-center justify-center text-white font-bold text-sm">
            CS
          </div>
          <div>
            <span className="font-semibold text-campus-text tracking-tight text-base">CampusSync</span>
            <span className="ml-2 text-xs font-medium text-campus-textDim">Enterprise Academic Platform</span>
          </div>
        </div>
        <Link
          to="/club-login"
          className="text-xs text-campus-textMuted hover:text-campus-jade-700 font-medium transition-colors"
        >
          Club Core Portal &rarr;
        </Link>
      </header>

      {/* Main Login Centerpiece */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-campus-card rounded-xl border border-campus-border shadow-card p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-campus-text tracking-tight">Sign In</h1>
            <p className="text-sm text-campus-textMuted mt-1">
              Connect to your university services and academic records.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 bg-campus-alert-redBg border border-campus-alert-redBorder rounded-lg flex items-start space-x-3 text-sm text-campus-alert-red">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {!challenge ? (
            /* STEP 1 & 2: Role Selection + Email / Password */
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              {/* Step 1: Role Selector (Who are you?) */}
              <div>
                <label className="block text-xs font-semibold text-campus-textMuted uppercase tracking-wider mb-2">
                  1. Who are you?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('STUDENT')}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedRole === 'STUDENT'
                        ? 'border-campus-jade-700 bg-campus-jade-50 text-campus-jade-900 shadow-sm ring-1 ring-campus-jade-700'
                        : 'border-campus-border bg-campus-surface text-campus-textMuted hover:border-campus-sage-300'
                    }`}
                  >
                    <GraduationCap className={`w-5 h-5 mb-1 ${selectedRole === 'STUDENT' ? 'text-campus-jade-700' : 'text-campus-textDim'}`} />
                    Student
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('FACULTY')}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedRole === 'FACULTY'
                        ? 'border-campus-jade-700 bg-campus-jade-50 text-campus-jade-900 shadow-sm ring-1 ring-campus-jade-700'
                        : 'border-campus-border bg-campus-surface text-campus-textMuted hover:border-campus-sage-300'
                    }`}
                  >
                    <BookOpen className={`w-5 h-5 mb-1 ${selectedRole === 'FACULTY' ? 'text-campus-jade-700' : 'text-campus-textDim'}`} />
                    Faculty
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('ADMINISTRATOR')}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedRole === 'ADMINISTRATOR'
                        ? 'border-campus-jade-700 bg-campus-jade-50 text-campus-jade-900 shadow-sm ring-1 ring-campus-jade-700'
                        : 'border-campus-border bg-campus-surface text-campus-textMuted hover:border-campus-sage-300'
                    }`}
                  >
                    <ShieldCheck className={`w-5 h-5 mb-1 ${selectedRole === 'ADMINISTRATOR' ? 'text-campus-jade-700' : 'text-campus-textDim'}`} />
                    Admin
                  </button>
                </div>
              </div>

              {/* Step 2: Email & Password */}
              <div className="space-y-4 pt-1">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-campus-text mb-1.5">
                    College Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-textDim">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@campus.edu"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-campus-text mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-textDim">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Demo Hint Badge */}
              <div className="p-3 bg-campus-sage-50 border border-campus-sage-200 rounded-lg text-xs text-campus-sage-700 flex items-center justify-between">
                <span>Demo loaded for: <strong>{selectedRole}</strong></span>
                <span className="text-[11px] text-campus-textDim font-mono">pw: {selectedRole === 'STUDENT' ? 'Student@123' : selectedRole === 'FACULTY' ? 'Faculty@123' : 'Admin@123'}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-campus-jade-700 hover:bg-campus-jade-800 disabled:opacity-60 text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 3: 6-Digit OTP Verification Screen */
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="p-4 bg-campus-jade-50 border border-campus-jade-200 rounded-lg text-sm text-campus-jade-900">
                <div className="flex items-center space-x-2 font-semibold text-xs uppercase tracking-wider text-campus-jade-700 mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>Two-Step Security Verification</span>
                </div>
                <p className="text-xs text-campus-textMuted mt-1">
                  A single-use 6-digit code was sent to <strong className="text-campus-text">{challenge.maskedEmail}</strong>.
                </p>
              </div>

              {/* Development Console Note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <div className="font-semibold mb-0.5">Development Testing Mode:</div>
                Check your server terminal log — the 6-digit OTP is printed there automatically.
              </div>

              <div>
                <label htmlFor="otp" className="block text-xs font-semibold text-campus-text mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full py-3 text-center font-mono text-2xl tracking-[0.5em] bg-campus-surface border border-campus-border rounded-lg text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setChallenge(null);
                    setOtp('');
                    setErrorMessage(null);
                  }}
                  className="text-campus-textMuted hover:text-campus-text"
                >
                  &larr; Back to login
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isResending}
                  onClick={handleResend}
                  className="text-campus-jade-700 hover:text-campus-jade-800 disabled:text-campus-textDim font-medium flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || isVerifying}
                className="w-full py-2.5 px-4 bg-campus-jade-700 hover:bg-campus-jade-800 disabled:opacity-60 text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Separate Club Login Link */}
          <div className="mt-8 pt-4 border-t border-campus-borderSubtle text-center text-xs text-campus-textMuted">
            Are you a Club Lead?{' '}
            <Link to="/club-login" className="text-campus-jade-700 hover:underline font-medium">
              Access the Club Core Portal
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-campus-textDim">
        CampusSync Academic Management Platform &bull; Protected by Multi-Factor Authentication
      </footer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LoginChallenge } from '../../types/auth';
import {
  Users,
  ArrowRight,
  RefreshCw,
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export const ClubLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, initiateLogin, verifyOtp, resendOtp } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user && role === 'CLUB_CORE') {
      navigate('/club/dashboard', { replace: true });
    }
  }, [user, role, navigate]);

  const [email, setEmail] = useState('robotics.lead@campus.edu');
  const [password, setPassword] = useState('Club@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await initiateLogin(email, password, 'CLUB_CORE');
      setChallenge(result);
      setResendCooldown(60);
      showToast(result.message, 'info', 'Verification Code Sent');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
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
      const loggedUser = await verifyOtp(challenge.challengeId, otp);
      showToast(`Welcome back, ${loggedUser.fullName}`, 'success', 'Club Portal Access');
      navigate('/club/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.');
      showToast(err.message || 'Verification error', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col justify-between">
      <header className="px-6 py-4 border-b border-campus-borderSubtle flex items-center justify-between">
        <Link to="/login" className="flex items-center space-x-2 text-xs text-campus-textMuted hover:text-campus-text">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to University Login</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 bg-campus-sage-100 text-campus-sage-900 rounded-full">
          Club Core Portal
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-campus-card rounded-xl border border-campus-border shadow-card p-8">
          <div className="mb-6 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-campus-sage-100 border border-campus-sage-200 flex items-center justify-center text-campus-jade-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-campus-text">Club Core Login</h1>
              <p className="text-xs text-campus-textMuted">Authorized club leads & core coordinators</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-campus-alert-redBg border border-campus-alert-redBorder rounded-lg flex items-start space-x-2.5 text-xs text-campus-alert-red">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!challenge ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-campus-text mb-1">Club Lead Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-campus-textDim pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-campus-text mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-campus-textDim pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text"
                  />
                </div>
              </div>

              <div className="p-3 bg-campus-sage-50 border border-campus-sage-200 rounded-lg text-xs text-campus-sage-700">
                Demo lead: <strong>robotics.lead@campus.edu</strong> (pw: Club@123)
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-campus-jade-700 hover:bg-campus-jade-800 text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In as Club Lead</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {challenge.devOtp ? (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">Demo Mode</span>
                  </div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-xs text-amber-800">Code:</span>
                    <span className="font-mono text-xl font-bold tracking-[0.4em] text-amber-900 select-all">{challenge.devOtp}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-campus-jade-50 border border-campus-jade-200 rounded-lg text-xs text-campus-jade-900">
                  Code sent to <strong>{challenge.maskedEmail}</strong>. Check server console in dev.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-campus-text mb-1.5">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3 text-center font-mono text-2xl tracking-[0.5em] bg-campus-surface border border-campus-border rounded-lg text-campus-text"
                />
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || isVerifying}
                className="w-full py-2.5 bg-campus-jade-700 hover:bg-campus-jade-800 text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Access Portal</span>}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-campus-textDim">
        Club Management Subsystem &bull; CampusSync
      </footer>
    </div>
  );
};

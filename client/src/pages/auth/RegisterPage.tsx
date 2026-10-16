import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LoginChallenge } from '../../types/auth';
import {
  User as UserIcon,
  Mail,
  Lock,
  BookOpen,
  Calendar,
  ArrowRight,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ProgramMeta {
  program: string;
  branch: string;
  semesters: number[];
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, register, verifyRegistration, resendOtp } = useAuth();
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

  // Programs metadata from Subject table
  const [programs, setPrograms] = useState<ProgramMeta[]>([]);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);

  // Form State (no role selector)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OTP Challenge State
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [devShowOtp, setDevShowOtp] = useState(false);

  // Load programs metadata from GET /api/meta/programs and config
  useEffect(() => {
    fetch('/api/meta/programs')
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.programs && Array.isArray(res.data.programs)) {
          setPrograms(res.data.programs);
          if (res.data.programs.length > 0) {
            setBranch(res.data.programs[0].branch);
            if (res.data.programs[0].semesters.length > 0) {
              setSemester(res.data.programs[0].semesters[0]);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMeta(false));

    fetch('/api/config')
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.devShowOtp) {
          setDevShowOtp(true);
        }
      })
      .catch(() => {});
  }, []);

  // Update semester default when branch changes
  const handleBranchChange = (newBranch: string) => {
    setBranch(newBranch);
    setErrorMessage(null);
    const found = programs.find((p) => p.branch === newBranch);
    if (found && found.semesters.length > 0) {
      setSemester(found.semesters[0]);
    } else {
      setSemester('');
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!branch || !semester) {
      setErrorMessage('Please select a valid branch and semester.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        branch,
        semester: Number(semester),
      });

      setChallenge(result);
      setResendCooldown(60);
      showToast(result.message || 'Verification code sent to your email.', 'info', 'Verification Code Sent');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
      showToast(err.message || 'Registration error', 'error');
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
      const authenticatedUser = await verifyRegistration(challenge.challengeId, otp);
      showToast(`Welcome to CampusSync, ${authenticatedUser.fullName}!`, 'success', 'Account Activated');
      navigate('/today', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please enter the correct code.');
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

  const activeBranchData = programs.find((p) => p.branch === branch);

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
            <span className="ml-2 text-xs font-medium text-campus-textDim">Student Self-Registration</span>
          </div>
        </div>
        <Link
          to="/login"
          className="text-xs text-campus-textMuted hover:text-campus-jade-700 font-medium transition-colors"
        >
          &larr; Back to Sign In
        </Link>
      </header>

      {/* Main Registration Form Centerpiece */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-campus-card rounded-xl border border-campus-border shadow-card p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-campus-text tracking-tight">Student Registration</h1>
            <p className="text-sm text-campus-textMuted mt-1">
              Create your verified student account to access classes, deadlines and campus services.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 bg-campus-alert-redBg border border-campus-alert-redBorder rounded-lg flex items-start space-x-3 text-sm text-campus-alert-red">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {!challenge ? (
            /* STEP 1: Registration Form (No role selector, role is always STUDENT) */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-campus-text mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-textDim">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. Priya Patel"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="regEmail" className="block text-xs font-medium text-campus-text mb-1.5">
                  College Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-textDim">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="regEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="student@campus.edu"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="regPassword" className="block text-xs font-medium text-campus-text mb-1.5">
                  Password <span className="text-[11px] text-campus-textDim">(minimum 8 characters)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-textDim">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="regPassword"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                  />
                </div>
              </div>

              {/* Branch and Semester (fetched from Subject table) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label htmlFor="branch" className="block text-xs font-medium text-campus-text mb-1.5">
                    Academic Branch
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-textDim">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <select
                      id="branch"
                      required
                      value={branch}
                      disabled={loadingMeta}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                    >
                      {loadingMeta ? (
                        <option value="">Loading branches...</option>
                      ) : (
                        programs.map((p) => (
                          <option key={p.branch} value={p.branch}>
                            {p.branch}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="semester" className="block text-xs font-medium text-campus-text mb-1.5">
                    Semester
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-textDim">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <select
                      id="semester"
                      required
                      value={semester}
                      disabled={loadingMeta || !activeBranchData}
                      onChange={(e) => {
                        setSemester(Number(e.target.value));
                        setErrorMessage(null);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-campus-surface border border-campus-border rounded-lg text-sm text-campus-text focus:bg-white focus:border-campus-jade-700 transition-colors"
                    >
                      {activeBranchData?.semesters.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || loadingMeta}
                className="w-full mt-2 py-2.5 px-4 bg-campus-jade-700 hover:bg-campus-jade-800 disabled:opacity-60 text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-xs text-campus-textMuted">
                Already registered?{' '}
                <Link to="/login" className="text-campus-jade-700 hover:underline font-semibold">
                  Sign in here
                </Link>
              </div>
            </form>
          ) : (
            /* STEP 2: 6-Digit OTP Verification Screen (Reusing OTP input) */
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="p-4 bg-campus-jade-50 border border-campus-jade-200 rounded-lg text-sm text-campus-jade-900">
                <div className="flex items-center space-x-2 font-semibold text-xs uppercase tracking-wider text-campus-jade-700 mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Student Email</span>
                </div>
                <p className="text-xs text-campus-textMuted mt-1">
                  A 6-digit confirmation code was sent to <strong className="text-campus-text">{challenge.maskedEmail}</strong>.
                </p>
              </div>

              {/* Dev OTP Banner */}
              {devShowOtp && challenge.devOtp ? (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">Demo Mode</span>
                    <span className="text-[10px] text-amber-600">DEV_SHOW_OTP is active</span>
                  </div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-xs text-amber-800">Your code:</span>
                    <span className="font-mono text-2xl font-bold tracking-[0.4em] text-amber-900 select-all">{challenge.devOtp}</span>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1">This banner is hidden automatically in production.</p>
                </div>
              ) : null}

              <div>
                <label htmlFor="regOtp" className="block text-xs font-semibold text-campus-text mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  id="regOtp"
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setErrorMessage(null);
                  }}
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
                  &larr; Edit details
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
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Activate Account & Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-campus-textDim">
        CampusSync Academic Management Platform &bull; Student Self-Registration
      </footer>
    </div>
  );
};

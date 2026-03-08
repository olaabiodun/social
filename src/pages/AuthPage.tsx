import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, ArrowRight, Shield, Zap, Star, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import "../styles/auth.css";

type AuthView = "login" | "signup" | "forgot";

const AuthPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<AuthView>("signup");
  const [signupStep, setSignupStep] = useState(1);
  const [forgotStep, setForgotStep] = useState<"A" | "D">("A");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginEmailErr, setLoginEmailErr] = useState(false);
  const [loginPwErr, setLoginPwErr] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [suFname, setSuFname] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suEmailErr, setSuEmailErr] = useState(false);
  const [suPw, setSuPw] = useState("");
  const [suPwErr, setSuPwErr] = useState(false);
  const [showSuPw, setShowSuPw] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [showPwStrength, setShowPwStrength] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailErr, setForgotEmailErr] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const toastTimer = useRef<number>();

  // Redirect if already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast({ show: false, msg: "" }), 3200);
  }, []);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const checkStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const showPage = (page: AuthView) => {
    setCurrentPage(page);
    if (page === "signup") setSignupStep(1);
    if (page === "forgot") setForgotStep("A");
  };

  const handleLogin = async () => {
    let valid = true;
    if (!validateEmail(loginEmail)) { setLoginEmailErr(true); valid = false; }
    if (loginPassword.length < 6) { setLoginPwErr(true); valid = false; }
    if (!valid) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);

    if (error) {
      showToast(`❌ ${error.message}`);
    } else {
      showToast("✅ Welcome back! Redirecting...");
    }
  };

  const handleSignupSubmit = async () => {
    if (!suFname.trim()) { showToast("Please enter a username"); return; }
    if (!validateEmail(suEmail)) { setSuEmailErr(true); return; }
    if (suPw.length < 6) { setSuPwErr(true); return; }
    if (!termsChecked) { showToast("Please accept the terms to continue"); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPw,
      options: {
        data: { username: suFname },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      showToast(`❌ ${error.message}`);
    } else {
      showToast("✅ Account created! Check your email to confirm.");
      setSignupStep(2);
    }
  };

  const sendReset = async () => {
    if (!validateEmail(forgotEmail)) { setForgotEmailErr(true); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      showToast(`❌ ${error.message}`);
    } else {
      setForgotStep("D");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) showToast(`❌ ${error.message}`);
  };

  const strengthLevels = ["", "weak", "fair", "good", "strong"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const BackButton = ({ onClick, label = "Back" }: { onClick: () => void; label?: string }) => (
    <button className="auth-back-btn" onClick={onClick}>
      <ArrowLeft size={16} />
      {label}
    </button>
  );

  const PasswordStrengthBars = ({ score }: { score: number }) => (
    <div className="pw-strength show">
      <div className="pw-bars">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`pw-bar${i < score ? ` ${strengthLevels[score]}` : ""}`} />
        ))}
      </div>
      <div className="pw-label">{score ? `${strengthLabels[score]} password` : ""}</div>
    </div>
  );

  return (
    <div className="auth-wrapper">
      {/* Toast */}
      <div className={`auth-toast${toast.show ? " show" : ""}`}>
        <Zap size={16} className="toast-icon" />
        <span>{toast.msg}</span>
      </div>

      <div className="auth-container">
        {/* LEFT — Branding */}
        <div className="auth-left">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />
          <div className="auth-left-inner">
            <Link to="/" className="auth-logo">
              <div className="auth-logo-dot" />
              <span>Goodluck<strong>Store</strong></span>
            </Link>

            <div className="auth-left-content">
              <div className="auth-badge">
                <Shield size={12} />
                Trusted Platform
              </div>
              <h1 className="auth-headline">
                Your Digital<br />
                <span className="auth-headline-accent">Marketplace</span>
              </h1>
              <p className="auth-description">
                Access premium accounts across all major platforms with instant delivery, verified quality, and full support.
              </p>
            </div>

            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon"><Zap size={18} /></div>
                <div>
                  <div className="auth-feature-title">Instant Delivery</div>
                  <div className="auth-feature-desc">Get your accounts within seconds</div>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon"><Shield size={18} /></div>
                <div>
                  <div className="auth-feature-title">Fully Verified</div>
                  <div className="auth-feature-desc">Every account is quality checked</div>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon"><Star size={18} /></div>
                <div>
                  <div className="auth-feature-title">24/7 Support</div>
                  <div className="auth-feature-desc">We're here whenever you need us</div>
                </div>
              </div>
            </div>

            <div className="auth-stats">
              <div className="auth-stat">
                <div className="auth-stat-num">10K+</div>
                <div className="auth-stat-label">Accounts Sold</div>
              </div>
              <div className="auth-stat">
                <div className="auth-stat-num">98%</div>
                <div className="auth-stat-label">Satisfaction</div>
              </div>
              <div className="auth-stat">
                <div className="auth-stat-num">4.9★</div>
                <div className="auth-stat-label">Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="auth-right">
          <div className="auth-card">
            {/* LOGIN */}
            <div className={`auth-view${currentPage === "login" ? " active" : ""}`}>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Welcome back</h2>
                <p className="auth-form-sub">
                  Don't have an account?{" "}
                  <a onClick={() => showPage("signup")}>Sign up</a>
                </p>
              </div>

              <div className="auth-social-row">
                <button className="auth-social-btn" onClick={handleGoogleLogin}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
              </div>

              <div className="auth-divider"><span>or</span></div>

              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    className={loginEmailErr ? "error" : ""}
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginEmailErr(false); }}
                    placeholder="name@example.com"
                  />
                </div>
                {loginEmailErr && <span className="auth-field-error">Please enter a valid email</span>}
              </div>

              <div className="auth-field">
                <div className="auth-field-header">
                  <label>Password</label>
                  <button className="auth-forgot-link" onClick={() => showPage("forgot")}>Forgot?</button>
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showLoginPw ? "text" : "password"}
                    className={loginPwErr ? "error" : ""}
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginPwErr(false); }}
                    placeholder="Enter your password"
                  />
                  <button className="auth-eye" onClick={() => setShowLoginPw(!showLoginPw)}>
                    {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginPwErr && <span className="auth-field-error">Password must be at least 6 characters</span>}
              </div>

              <label className="auth-checkbox">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                <span className="auth-checkmark" />
                Remember me for 30 days
              </label>

              <button className={`auth-submit${loading ? " loading" : ""}`} onClick={handleLogin} disabled={loading}>
                <span className="auth-submit-text">Sign In</span>
                <ArrowRight size={16} className="auth-submit-arrow" />
              </button>
            </div>

            {/* SIGNUP */}
            <div className={`auth-view${currentPage === "signup" ? " active" : ""}`}>
              <div className="auth-progress">
                {[1, 2].map((n) => (
                  <div key={n} className={`auth-progress-step${n <= signupStep ? " active" : ""}`}>
                    <div className="auth-progress-dot">{n <= signupStep ? <CheckCircle2 size={14} /> : n}</div>
                    <span>{n === 1 ? "Details" : "Confirm"}</span>
                  </div>
                ))}
                <div className="auth-progress-line">
                  <div className={`auth-progress-fill${signupStep >= 2 ? " complete" : ""}`} />
                </div>
              </div>

              {signupStep === 1 && (
                <div>
                  <div className="auth-form-header">
                    <h2 className="auth-form-title">Create account</h2>
                    <p className="auth-form-sub">
                      Already have an account?{" "}
                      <a onClick={() => showPage("login")}>Sign in</a>
                    </p>
                  </div>

                  <div className="auth-social-row">
                    <button className="auth-social-btn" onClick={handleGoogleLogin}>
                      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </button>
                  </div>

                  <div className="auth-divider"><span>or</span></div>

                  <div className="auth-field">
                    <label>Username</label>
                    <div className="auth-input-wrap">
                      <User size={16} className="auth-input-icon" />
                      <input type="text" value={suFname} onChange={(e) => setSuFname(e.target.value)} placeholder="johndoe" />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>Email</label>
                    <div className="auth-input-wrap">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        className={suEmailErr ? "error" : ""}
                        value={suEmail}
                        onChange={(e) => { setSuEmail(e.target.value); setSuEmailErr(false); }}
                        placeholder="name@example.com"
                      />
                    </div>
                    {suEmailErr && <span className="auth-field-error">Please enter a valid email</span>}
                  </div>

                  <div className="auth-field">
                    <label>Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showSuPw ? "text" : "password"}
                        value={suPw}
                        onChange={(e) => {
                          setSuPw(e.target.value);
                          setPwStrength(checkStrength(e.target.value));
                          setShowPwStrength(true);
                          setSuPwErr(false);
                        }}
                        placeholder="Min. 6 characters"
                      />
                      <button className="auth-eye" onClick={() => setShowSuPw(!showSuPw)}>
                        {showSuPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {showPwStrength && <PasswordStrengthBars score={pwStrength} />}
                  </div>

                  <label className="auth-checkbox">
                    <input type="checkbox" checked={termsChecked} onChange={() => setTermsChecked(!termsChecked)} />
                    <span className="auth-checkmark" />
                    I agree to the <a>Terms</a> and <a>Privacy Policy</a>
                  </label>

                  <button className={`auth-submit${loading ? " loading" : ""}`} onClick={handleSignupSubmit} disabled={loading}>
                    <span className="auth-submit-text">Create Account</span>
                    <ArrowRight size={16} className="auth-submit-arrow" />
                  </button>
                </div>
              )}

              {signupStep === 2 && (
                <div className="auth-success">
                  <div className="auth-success-icon">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3>Check your email!</h3>
                  <p>We sent a confirmation link to <strong>{suEmail}</strong>. Click it to activate your account.</p>
                  <button className="auth-submit" onClick={() => showPage("login")}>
                    <span className="auth-submit-text">Go to Sign In</span>
                    <ArrowRight size={16} className="auth-submit-arrow" />
                  </button>
                </div>
              )}
            </div>

            {/* FORGOT PASSWORD */}
            <div className={`auth-view${currentPage === "forgot" ? " active" : ""}`}>
              <BackButton onClick={() => showPage("login")} label="Back to Sign In" />

              {forgotStep === "A" && (
                <div>
                  <div className="auth-form-header">
                    <h2 className="auth-form-title">Reset password</h2>
                    <p className="auth-form-sub">Enter your email and we'll send a reset link.</p>
                  </div>
                  <div className="auth-field">
                    <label>Email</label>
                    <div className="auth-input-wrap">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        className={forgotEmailErr ? "error" : ""}
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailErr(false); }}
                        placeholder="name@example.com"
                      />
                    </div>
                    {forgotEmailErr && <span className="auth-field-error">Please enter a valid email</span>}
                  </div>
                  <button className={`auth-submit${loading ? " loading" : ""}`} onClick={sendReset} disabled={loading}>
                    <span className="auth-submit-text">Send Reset Link</span>
                    <ArrowRight size={16} className="auth-submit-arrow" />
                  </button>
                </div>
              )}

              {forgotStep === "D" && (
                <div className="auth-success">
                  <div className="auth-success-icon">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3>Check your email!</h3>
                  <p>We sent a password reset link to <strong>{forgotEmail}</strong>.</p>
                  <button className="auth-submit" onClick={() => showPage("login")}>
                    <span className="auth-submit-text">Back to Sign In</span>
                    <ArrowRight size={16} className="auth-submit-arrow" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

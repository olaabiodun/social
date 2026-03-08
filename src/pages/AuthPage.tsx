import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

type AuthView = "login" | "signup" | "forgot";

const AuthPage = () => {
  const [currentPage, setCurrentPage] = useState<AuthView>("signup");
  const [signupStep, setSignupStep] = useState(1);
  const [forgotStep, setForgotStep] = useState<"A" | "B" | "C" | "D">("A");

  // Form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginEmailErr, setLoginEmailErr] = useState(false);
  const [loginPwErr, setLoginPwErr] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [suUsername, setSuUsername] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suEmailErr, setSuEmailErr] = useState(false);
  const [suPw, setSuPw] = useState("");
  const [suPw2, setSuPw2] = useState("");
  const [suPwErr, setSuPwErr] = useState(false);
  const [suPwErrMsg, setSuPwErrMsg] = useState("⚠ Passwords do not match");
  const [showSuPw, setShowSuPw] = useState(false);
  const [showSuPw2, setShowSuPw2] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [showPwStrength, setShowPwStrength] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailErr, setForgotEmailErr] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [newPwErr, setNewPwErr] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showNewPw2, setShowNewPw2] = useState(false);
  const [newPwStrength, setNewPwStrength] = useState(0);

  // OTP
  const [signupOtp, setSignupOtp] = useState(["", "", "", "", "", ""]);
  const [forgotOtp, setForgotOtp] = useState(["", "", "", "", "", ""]);
  const signupOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Loading
  const [loading, setLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, msg: "" });
  const toastTimer = useRef<number>();

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast({ show: false, msg: "" }), 3200);
  }, []);

  // Resend
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendText, setResendText] = useState("Resend Code");

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const simulateLoading = (cb: () => void) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); cb(); }, 1200 + Math.random() * 400);
  };

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

  // Login
  const handleLogin = () => {
    let valid = true;
    if (!validateEmail(loginEmail)) { setLoginEmailErr(true); valid = false; }
    if (loginPassword.length < 6) { setLoginPwErr(true); valid = false; }
    if (!valid) return;
    simulateLoading(() => showToast("✅ Welcome back! Redirecting..."));
  };

  // Signup step 1
  const handleSignupStep1 = () => {
    if (!validateEmail(suEmail)) { setSuEmailErr(true); return; }
    simulateLoading(() => setSignupStep(2));
  };

  // Signup step 2
  const handleSignupStep2 = () => {
    if (suPw.length < 6) { setSuPwErr(true); setSuPwErrMsg("⚠ Password must be at least 6 characters"); return; }
    if (suPw !== suPw2) { setSuPwErr(true); setSuPwErrMsg("⚠ Passwords do not match"); return; }
    if (!termsChecked) { showToast("⚠ Please accept the terms to continue"); return; }
    simulateLoading(() => setSignupStep(3));
  };

  // OTP handler
  const handleOtp = (otp: string[], setOtp: (v: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, idx: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[idx] = cleaned;
    setOtp(newOtp);
    if (cleaned && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleOtpBack = (otp: string[], setOtp: (v: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const newOtp = [...otp];
      newOtp[idx - 1] = "";
      setOtp(newOtp);
      refs.current[idx - 1]?.focus();
    }
  };

  // Verify signup OTP
  const verifySignupOtp = () => {
    if (signupOtp.join("").length < 6) { showToast("⚠ Please enter the full 6-digit code"); return; }
    simulateLoading(() => {
      showToast("✅ Account created! Welcome to Goodluck Store!");
      setTimeout(() => showPage("login"), 1800);
    });
  };

  // Forgot password
  const sendReset = () => {
    if (!validateEmail(forgotEmail)) { setForgotEmailErr(true); return; }
    simulateLoading(() => setForgotStep("B"));
  };

  const verifyResetOtp = () => {
    if (forgotOtp.join("").length < 6) { showToast("⚠ Please enter the full 6-digit code"); return; }
    simulateLoading(() => setForgotStep("C"));
  };

  const resetPassword = () => {
    if (newPw.length < 6 || newPw !== newPw2) { setNewPwErr(true); return; }
    simulateLoading(() => setForgotStep("D"));
  };

  const resendCode = () => {
    setResendDisabled(true);
    let t = 30;
    showToast("📧 Code resent to your email!");
    const iv = setInterval(() => {
      setResendText(`Resend in ${t}s`);
      t--;
      if (t < 0) {
        clearInterval(iv);
        setResendDisabled(false);
        setResendText("Resend Code");
        showToast("📧 A new code has been sent!");
      }
    }, 1000);
  };

  const handleSocial = (provider: string) => showToast(`🔗 Connecting to ${provider}...`);

  const strengthLevels = ["", "weak", "fair", "good", "strong"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const BackButton = ({ onClick, label = "Back" }: { onClick: () => void; label?: string }) => (
    <button className="back-btn" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      {label}
    </button>
  );

  const OtpInputs = ({ otp, setOtp, refs }: { otp: string[]; setOtp: (v: string[]) => void; refs: React.MutableRefObject<(HTMLInputElement | null)[]> }) => (
    <div className="otp-group">
      {otp.map((v, i) => (
        <input
          key={i}
          type="text"
          maxLength={1}
          className={`otp-input${v ? " filled" : ""}`}
          value={v}
          ref={(el) => { refs.current[i] = el; }}
          onChange={(e) => handleOtp(otp, setOtp, refs, i, e.target.value)}
          onKeyDown={(e) => handleOtpBack(otp, setOtp, refs, i, e)}
        />
      ))}
    </div>
  );

  const PasswordStrengthBars = ({ score }: { score: number }) => (
    <div className="pw-strength show">
      <div className="pw-bars">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`pw-bar${i < score ? ` ${strengthLevels[score]}` : ""}`} />
        ))}
      </div>
      <div className="pw-label">{score ? `${strengthLabels[score]} password` : "Enter your password"}</div>
    </div>
  );

  return (
    <div className="auth-page-wrapper">
      <div className="bg-canvas">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
      </div>

      {/* Toast */}
      <div className={`auth-toast${toast.show ? " show" : ""}`}>
        <span className="toast-icon">⚡</span>
        <span>{toast.msg}</span>
      </div>

      <div className="auth-layout">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="left-panel-bg-text">GOODLUCK ACCOUNTS</div>
          <Link to="/" className="left-logo">
            <div className="dot" />
            Goodluck Store<span style={{ opacity: 0.5 }}>Accounts</span>
          </Link>
          <div className="left-content">
            <div className="left-tag"><span>●</span> Premium Platform</div>
            <h1 className="left-headline">GROW YOUR <span className="outline">SOCIAL</span> EMPIRE</h1>
            <div className="left-cta">
              <Link to="/" className="left-dashboard-link">
                <i className="fa-solid fa-arrow-right" /> Go to Homepage
              </Link>
            </div>
            <p className="left-sub">Access thousands of verified accounts across all major platforms. Instant delivery, real followers, guaranteed.</p>
            <div className="left-stats">
              <div className="lstat"><div className="lstat-num">10K+</div><div className="lstat-label">Accounts</div></div>
              <div className="lstat"><div className="lstat-num">98%</div><div className="lstat-label">Satisfied</div></div>
              <div className="lstat"><div className="lstat-num">24/7</div><div className="lstat-label">Support</div></div>
            </div>
          </div>
          <div className="left-reviews">
            <div className="review-card">
              <div className="review-text">"The best decision I made for my brand. Instant access, real followers — couldn't be happier."</div>
              <div className="review-author">
                <div className="review-avatar">SJ</div>
                <div>
                  <div className="review-name">Sarah Johnson</div>
                  <div className="review-role">Content Creator · Instagram 100K</div>
                  <div className="review-stars">★★★★★</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="auth-form-wrap">

            {/* LOGIN */}
            <div className={`auth-page-view${currentPage === "login" ? " active" : ""}`}>
              <div className="form-header">
                <div className="form-tag">Welcome Back</div>
                <h2 className="form-title">SIGN IN</h2>
                <p className="form-sub">Don't have an account? <a onClick={() => showPage("signup")}>Create one free</a></p>
              </div>
              <div className="social-auth">
                <button className="social-auth-btn" onClick={() => handleSocial("Google")}><span>🌐</span> Google</button>
                <button className="social-auth-btn" onClick={() => handleSocial("Twitter")}><span>𝕏</span> Twitter</button>
              </div>
              <div className="divider"><span>or continue with email</span></div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">✉</span>
                  <input type="email" className={`input-field${loginEmailErr ? " error" : ""}`} value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setLoginEmailErr(false); }} placeholder="you@example.com" />
                </div>
                <div className={`input-error${loginEmailErr ? " show" : ""}`}>⚠ Please enter a valid email</div>
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input type={showLoginPw ? "text" : "password"} className={`input-field${loginPwErr ? " error" : ""}`} value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setLoginPwErr(false); }} placeholder="Enter your password" />
                  <button className="eye-toggle" onClick={() => setShowLoginPw(!showLoginPw)}>{showLoginPw ? "🙈" : "👁"}</button>
                </div>
                <div className={`input-error${loginPwErr ? " show" : ""}`}>⚠ Password must be at least 6 characters</div>
              </div>
              <div className="forgot-row">
                <button className="forgot-link" onClick={() => showPage("forgot")}>Forgot password?</button>
              </div>
              <div className="checkbox-group">
                <div className={`custom-checkbox${rememberMe ? " checked" : ""}`} onClick={() => setRememberMe(!rememberMe)} />
                <label className="checkbox-label" onClick={() => setRememberMe(!rememberMe)}>Keep me signed in for 30 days</label>
              </div>
              <button className={`btn-submit${loading ? " loading" : ""}`} onClick={handleLogin} disabled={loading}>
                <span className="btn-text">Sign In →</span>
              </button>
            </div>

            {/* SIGNUP */}
            <div className={`auth-page-view${currentPage === "signup" ? " active" : ""}`}>
              <div className="progress-dots">
                {[1, 2, 3].map((n) => <div key={n} className={`pdot${n <= signupStep ? " active" : ""}`} />)}
              </div>

              {/* Step 1 */}
              {signupStep === 1 && (
                <div>
                  <div className="form-header">
                    <div className="form-tag">Create Account</div>
                    <h2 className="form-title">GET STARTED</h2>
                    <p className="form-sub">Already have an account? <a onClick={() => showPage("login")}>Sign in</a></p>
                  </div>
                  <div className="social-auth">
                    <button className="social-auth-btn" onClick={() => handleSocial("Google")}><span>🌐</span> Google</button>
                    <button className="social-auth-btn" onClick={() => handleSocial("Twitter")}><span>𝕏</span> Twitter</button>
                  </div>
                  <div className="divider"><span>or register with email</span></div>
                  <div className="name-grid">
                    <div className="input-group">
                      <label className="input-label">First Name</label>
                      <div className="input-wrap"><span className="input-icon">👤</span><input type="text" className="input-field" value={suFname} onChange={(e) => setSuFname(e.target.value)} placeholder="John" /></div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Last Name</label>
                      <div className="input-wrap"><span className="input-icon">👤</span><input type="text" className="input-field" value={suLname} onChange={(e) => setSuLname(e.target.value)} placeholder="Doe" /></div>
                    </div>
                  </div>
                  <div style={{ height: 18 }} />
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className="input-wrap">
                      <span className="input-icon">✉</span>
                      <input type="email" className={`input-field${suEmailErr ? " error" : ""}`} value={suEmail} onChange={(e) => { setSuEmail(e.target.value); setSuEmailErr(false); }} placeholder="you@example.com" />
                    </div>
                    <div className={`input-error${suEmailErr ? " show" : ""}`}>⚠ Please enter a valid email</div>
                  </div>
                  <button className={`btn-submit${loading ? " loading" : ""}`} onClick={handleSignupStep1} disabled={loading}>
                    <span className="btn-text">Continue →</span>
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {signupStep === 2 && (
                <div>
                  <BackButton onClick={() => setSignupStep(1)} />
                  <div className="form-header">
                    <div className="form-tag">Secure Your Account</div>
                    <h2 className="form-title">SET<br />PASSWORD</h2>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <div className="input-wrap">
                      <span className="input-icon">🔒</span>
                      <input type={showSuPw ? "text" : "password"} className="input-field" value={suPw} onChange={(e) => { setSuPw(e.target.value); const s = checkStrength(e.target.value); setPwStrength(s); setShowPwStrength(true); setSuPwErr(false); }} placeholder="Create a strong password" />
                      <button className="eye-toggle" onClick={() => setShowSuPw(!showSuPw)}>{showSuPw ? "🙈" : "👁"}</button>
                    </div>
                    {showPwStrength && <PasswordStrengthBars score={pwStrength} />}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <div className="input-wrap">
                      <span className="input-icon">🔒</span>
                      <input type={showSuPw2 ? "text" : "password"} className={`input-field${suPwErr ? " error" : ""}`} value={suPw2} onChange={(e) => { setSuPw2(e.target.value); setSuPwErr(false); }} placeholder="Repeat your password" />
                      <button className="eye-toggle" onClick={() => setShowSuPw2(!showSuPw2)}>{showSuPw2 ? "🙈" : "👁"}</button>
                    </div>
                    <div className={`input-error${suPwErr ? " show" : ""}`}>{suPwErrMsg}</div>
                  </div>
                  <div className="checkbox-group">
                    <div className={`custom-checkbox${termsChecked ? " checked" : ""}`} onClick={() => setTermsChecked(!termsChecked)} />
                    <label className="checkbox-label" onClick={() => setTermsChecked(!termsChecked)}>
                      I agree to the <a>Terms of Service</a> and <a>Privacy Policy</a>
                    </label>
                  </div>
                  <button className={`btn-submit${loading ? " loading" : ""}`} onClick={handleSignupStep2} disabled={loading}>
                    <span className="btn-text">Create Account →</span>
                  </button>
                </div>
              )}

              {/* Step 3 - Verify */}
              {signupStep === 3 && (
                <div>
                  <BackButton onClick={() => setSignupStep(2)} />
                  <div className="form-header">
                    <div className="form-tag">Almost There</div>
                    <h2 className="form-title">VERIFY<br />EMAIL</h2>
                    <p className="form-sub">We sent a 6-digit code to <strong style={{ color: "var(--yellow)" }}>{suEmail}</strong></p>
                  </div>
                  <OtpInputs otp={signupOtp} setOtp={setSignupOtp} refs={signupOtpRefs} />
                  <button className={`btn-submit${loading ? " loading" : ""}`} onClick={verifySignupOtp} disabled={loading}>
                    <span className="btn-text">Verify & Continue →</span>
                  </button>
                  <div className="resend-row">
                    Didn't receive it?{" "}
                    <button className="resend-btn" disabled={resendDisabled} onClick={resendCode}>{resendText}</button>
                  </div>
                </div>
              )}
            </div>

            {/* FORGOT PASSWORD */}
            <div className={`auth-page-view${currentPage === "forgot" ? " active" : ""}`}>
              <BackButton onClick={() => showPage("login")} label="Back to Sign In" />

              {forgotStep === "A" && (
                <div>
                  <div className="form-header">
                    <div className="form-tag">Password Recovery</div>
                    <h2 className="form-title">FORGOT<br />PASSWORD?</h2>
                    <p className="form-sub">Enter your email and we'll send a reset code.</p>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className="input-wrap">
                      <span className="input-icon">✉</span>
                      <input type="email" className={`input-field${forgotEmailErr ? " error" : ""}`} value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailErr(false); }} placeholder="you@example.com" />
                    </div>
                    <div className={`input-error${forgotEmailErr ? " show" : ""}`}>⚠ Please enter a valid email</div>
                  </div>
                  <button className={`btn-submit${loading ? " loading" : ""}`} onClick={sendReset} disabled={loading}>
                    <span className="btn-text">Send Reset Code →</span>
                  </button>
                </div>
              )}

              {forgotStep === "B" && (
                <div>
                  <div className="form-header">
                    <div className="form-tag">Check Your Email</div>
                    <h2 className="form-title">ENTER<br />CODE</h2>
                    <p className="form-sub">We sent a code to <strong style={{ color: "var(--yellow)" }}>{forgotEmail}</strong></p>
                  </div>
                  <OtpInputs otp={forgotOtp} setOtp={setForgotOtp} refs={forgotOtpRefs} />
                  <button className={`btn-submit${loading ? " loading" : ""}`} onClick={verifyResetOtp} disabled={loading}>
                    <span className="btn-text">Verify Code →</span>
                  </button>
                  <div className="resend-row">
                    Didn't receive it?{" "}
                    <button className="resend-btn" disabled={resendDisabled} onClick={resendCode}>{resendText}</button>
                  </div>
                </div>
              )}

              {forgotStep === "C" && (
                <div>
                  <div className="form-header">
                    <div className="form-tag">Almost Done</div>
                    <h2 className="form-title">NEW<br />PASSWORD</h2>
                    <p className="form-sub">Choose a strong new password.</p>
                  </div>
                  <div className="input-group">
                    <label className="input-label">New Password</label>
                    <div className="input-wrap">
                      <span className="input-icon">🔒</span>
                      <input type={showNewPw ? "text" : "password"} className="input-field" value={newPw} onChange={(e) => { setNewPw(e.target.value); setNewPwStrength(checkStrength(e.target.value)); setNewPwErr(false); }} placeholder="Create new password" />
                      <button className="eye-toggle" onClick={() => setShowNewPw(!showNewPw)}>{showNewPw ? "🙈" : "👁"}</button>
                    </div>
                    <PasswordStrengthBars score={newPwStrength} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Confirm New Password</label>
                    <div className="input-wrap">
                      <span className="input-icon">🔒</span>
                      <input type={showNewPw2 ? "text" : "password"} className={`input-field${newPwErr ? " error" : ""}`} value={newPw2} onChange={(e) => { setNewPw2(e.target.value); setNewPwErr(false); }} placeholder="Repeat new password" />
                      <button className="eye-toggle" onClick={() => setShowNewPw2(!showNewPw2)}>{showNewPw2 ? "🙈" : "👁"}</button>
                    </div>
                    <div className={`input-error${newPwErr ? " show" : ""}`}>⚠ Passwords do not match</div>
                  </div>
                  <button className={`btn-submit${loading ? " loading" : ""}`} onClick={resetPassword} disabled={loading}>
                    <span className="btn-text">Reset Password →</span>
                  </button>
                </div>
              )}

              {forgotStep === "D" && (
                <div className="success-msg show">
                  <div className="success-icon">✓</div>
                  <h3>PASSWORD RESET!</h3>
                  <p>Your password has been successfully updated. You can now sign in with your new password.</p>
                  <button className="btn-submit" onClick={() => showPage("login")}>
                    <span className="btn-text">Go to Sign In →</span>
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import "../styles/auth.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Check for recovery session from URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      // Supabase handles setting the session from the hash automatically
    }
  }, []);

  const handleReset = async () => {
    if (newPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPw !== newPw2) { setError("Passwords do not match"); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setDone(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container" style={{ justifyContent: "center" }}>
        <div className="auth-right" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="auth-card">
            <div className="auth-view active">
              {done ? (
                <div className="auth-success">
                  <div className="auth-success-icon"><CheckCircle2 size={32} /></div>
                  <h3>Password Updated!</h3>
                  <p>Redirecting to dashboard...</p>
                </div>
              ) : (
                <div>
                  <div className="auth-form-header">
                    <h2 className="auth-form-title">Set new password</h2>
                    <p className="auth-form-sub">Choose a strong new password for your account.</p>
                  </div>
                  <div className="auth-field">
                    <label>New Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                        placeholder="Min. 6 characters"
                      />
                      <button className="auth-eye" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Confirm Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPw2 ? "text" : "password"}
                        value={newPw2}
                        onChange={(e) => { setNewPw2(e.target.value); setError(""); }}
                        placeholder="Repeat password"
                      />
                      <button className="auth-eye" onClick={() => setShowPw2(!showPw2)}>
                        {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {error && <span className="auth-field-error">{error}</span>}
                  <button className={`auth-submit${loading ? " loading" : ""}`} onClick={handleReset} disabled={loading}>
                    <span className="auth-submit-text">Update Password</span>
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

export default ResetPassword;

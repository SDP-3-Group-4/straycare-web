import { useState, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, toFirebaseError } from "../../contexts/AuthContext";

import {
  TextField,
  Input,
  Label,
  FieldError,
  Button,
  Separator,
} from "@heroui/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Ticket,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import HeaderLogo from "../common/HeaderLogo";

type AuthMode = "login" | "register" | "forgot";

interface FormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  confirmPassword: string;
  referralCode: string;
}

const INITIAL_FORM: FormData = {
  email: "",
  password: "",
  name: "",
  phone: "",
  confirmPassword: "",
  referralCode: "",
};

/**
 * Auth form: login, registration, and password-reset modes, toggled in-place.
 * Uses HeroUI v3 compound TextField components with StrayCare brand theming.
 */
export default function AuthForm() {
  const { signInWithEmail, signUp, signInWithGoogle, resetPassword } =
    useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Enter a valid email address";
    }

    if (isForgot) {
      setErrors(errs);
      return Object.keys(errs).length === 0;
    }

    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Must be at least 8 characters";
    }

    if (!isLogin) {
      if (!form.name.trim()) errs.name = "Full name is required";

      if (!form.phone.trim()) {
        errs.phone = "Phone number is required";
      } else if (!/^\+?[\d\s-]{7,15}$/.test(form.phone)) {
        errs.phone = "Enter a valid phone number";
      }

      if (!form.confirmPassword) {
        errs.confirmPassword = "Confirm your password";
      } else if (form.confirmPassword !== form.password) {
        errs.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, isLogin, isForgot]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setIsLoading(true);
      setFormError("");

      try {
        if (mode === "forgot") {
          await resetPassword(form.email);
          setResetSent(true);
          return;
        }
        if (mode === "register") {
          await signUp({
            email: form.email,
            password: form.password,
            displayName: form.name,
            phone: form.phone,
            referralCode: form.referralCode || undefined,
          });
        } else {
          await signInWithEmail(form.email, form.password);
        }
        navigate("/");
      } catch (err: any) {
        console.error(err);
        setFormError(toFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [validate, mode, form, resetPassword, signUp, signInWithEmail, navigate],
  );

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setErrors({});
    setFormError("");
    setResetSent(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleGoogleAuth = useCallback(async () => {
    setFormError("");
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setFormError(toFirebaseError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  }, [signInWithGoogle, navigate]);

  const handleForgotPassword = useCallback(() => {
    setMode("forgot");
    setErrors({});
    setFormError("");
    setResetSent(false);
  }, []);

  const backToLogin = useCallback(() => {
    setMode("login");
    setResetSent(false);
    setFormError("");
  }, []);

  return (
    <div className="auth-form">
      {/* Brand mark */}
      <HeaderLogo
        className="auth-form__brand w-[280px] h-[65px] mb-2 mx-auto"
      />
      <h2 className="auth-form__title">
        {isForgot
          ? "Reset your password"
          : isLogin
            ? "Login to your account"
            : "Create your account"}
      </h2>

      {/* Google OAuth button — premium design, not HeroUI (custom) */}
      {!isForgot && (
        <button
          type="button"
          className="auth-form__google-btn"
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading}
          id="google-auth-btn"
        >
          {isGoogleLoading ? (
            <Loader2 className="auth-form__google-spinner" size={20} />
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      )}

      {!isForgot && (
        <div className="auth-form__divider">
          <Separator className="auth-form__divider-line" />
          <span className="auth-form__divider-text">or</span>
          <Separator className="auth-form__divider-line" />
        </div>
      )}

      {/* Global error banner */}
      {formError && (
        <div className="auth-form__error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      {/* Reset success */}
      {isForgot && resetSent && (
        <div
          className="auth-form__error-banner auth-form__error-banner--success"
          role="status"
        >
          <span>Password reset email sent. Check your inbox.</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="auth-form__fields transition-all duration-300"
      >
        {/* Registration-only fields */}
        {isRegister && (
          <>
            <TextField
              isInvalid={!!errors.name}
              isDisabled={isLoading}
              className="auth-form__textfield"
            >
              <Label className="auth-form__label">Full Name</Label>
              <div className="auth-form__input-wrapper">
                <User
                  size={18}
                  className="auth-form__input-icon"
                  aria-hidden="true"
                />
                <Input
                  id="auth-name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  autoComplete="name"
                  className="auth-form__input"
                />
              </div>
              {errors.name && (
                <FieldError className="auth-form__error">
                  {errors.name}
                </FieldError>
              )}
            </TextField>

            <TextField
              isInvalid={!!errors.phone}
              isDisabled={isLoading}
              className="auth-form__textfield"
            >
              <Label className="auth-form__label">Phone Number</Label>
              <div className="auth-form__input-wrapper">
                <Phone
                  size={18}
                  className="auth-form__input-icon"
                  aria-hidden="true"
                />
                <Input
                  id="auth-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  autoComplete="tel"
                  className="auth-form__input"
                />
              </div>
              {errors.phone && (
                <FieldError className="auth-form__error">
                  {errors.phone}
                </FieldError>
              )}
            </TextField>
          </>
        )}

        {/* Email */}
        <TextField
          isInvalid={!!errors.email}
          isDisabled={isLoading}
          className="auth-form__textfield"
        >
          <Label className="auth-form__label">Email</Label>
          <div className="auth-form__input-wrapper">
            <Mail
              size={18}
              className="auth-form__input-icon"
              aria-hidden="true"
            />
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="email"
              className="auth-form__input"
            />
          </div>
          {errors.email && (
            <FieldError className="auth-form__error">{errors.email}</FieldError>
          )}
        </TextField>

        {/* Password */}
        {!isForgot && (
          <TextField
            isInvalid={!!errors.password}
            isDisabled={isLoading}
            className="auth-form__textfield"
          >
            <div className="auth-form__label-row">
              <Label className="auth-form__label">Password</Label>
              {isLogin && (
                <button
                  type="button"
                  className="auth-form__forgot-link"
                  tabIndex={0}
                  id="forgot-password-link"
                  onClick={handleForgotPassword}
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="auth-form__input-wrapper">
              <Lock
                size={18}
                className="auth-form__input-icon"
                aria-hidden="true"
              />
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="auth-form__input"
              />
              <button
                type="button"
                className="auth-form__toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <FieldError className="auth-form__error">
                {errors.password}
              </FieldError>
            )}
          </TextField>
        )}

        {/* Confirm password (register only) */}
        {isRegister && (
          <TextField
            isInvalid={!!errors.confirmPassword}
            isDisabled={isLoading}
            className="auth-form__textfield"
          >
            <Label className="auth-form__label">Confirm Password</Label>
            <div className="auth-form__input-wrapper">
              <Lock
                size={18}
                className="auth-form__input-icon"
                aria-hidden="true"
              />
              <Input
                id="auth-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                autoComplete="new-password"
                className="auth-form__input"
              />
              <button
                type="button"
                className="auth-form__toggle-pw"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <FieldError className="auth-form__error">
                {errors.confirmPassword}
              </FieldError>
            )}
          </TextField>
        )}

        {/* Referral code (register only) */}
        {isRegister && (
          <TextField isDisabled={isLoading} className="auth-form__textfield">
            <Label className="auth-form__label">
              Referral Code
              <span className="auth-form__optional">(optional)</span>
            </Label>
            <div className="auth-form__input-wrapper">
              <Ticket
                size={18}
                className="auth-form__input-icon"
                aria-hidden="true"
              />
              <Input
                id="auth-referral"
                placeholder="e.g. STRAY2026"
                value={form.referralCode}
                onChange={(e) => updateField("referralCode", e.target.value)}
                autoComplete="off"
                className="auth-form__input"
              />
            </div>
          </TextField>
        )}

        {/* Submit */}
        <Button
          type="submit"
          className="auth-form__submit"
          isDisabled={isLoading}
          id="auth-submit-btn"
        >
          {isLoading ? (
            <Loader2 size={20} className="auth-form__spinner" />
          ) : (
            <>
              {isForgot
                ? "Send reset email"
                : isLogin
                  ? "Login now"
                  : "Create account"}
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>

      {/* Toggle mode */}
      <p className="auth-form__toggle">
        {isForgot && resetSent ? (
          <button
            type="button"
            className="auth-form__toggle-link"
            onClick={backToLogin}
            id="auth-back-to-login"
          >
            Back to Login
          </button>
        ) : isLogin ? (
          <>
            {"Don't have an account? "}
            <button
              type="button"
              className="auth-form__toggle-link"
              onClick={toggleMode}
              id="auth-toggle-mode"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="auth-form__toggle-link"
              onClick={toggleMode}
              id="auth-toggle-mode"
            >
              Login
            </button>
          </>
        )}
      </p>
    </div>
  );
}

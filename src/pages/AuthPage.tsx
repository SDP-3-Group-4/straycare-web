import "./AuthPage.css";
import HeroPanel from "../components/auth/HeroPanel";
import AuthForm from "../components/auth/AuthForm";
import Footer from "../components/layout/Footer";

/**
 * AuthPage — split-panel layout for login/registration.
 * Left: visual hero with interactive spheres.
 * Right: auth form + footer.
 */
export default function AuthPage() {
  return (
    <main className="auth-page">
      <div className="auth-page__left">
        <HeroPanel />
      </div>
      <div className="auth-page__right">
        <div className="auth-page__right-content">
          <AuthForm />
        </div>
        <Footer />
      </div>
    </main>
  );
}

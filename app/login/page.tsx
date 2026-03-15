import Image from "next/image";
import Link from "next/link";
import "../program/program.css";

export default function LoginPage() {
  return (
    <main className="program-login program-login--theme-test">
      <section className="program-login__hero">
        <div className="program-login__shell">
          <Link href="/" className="program-login__logo" aria-label="Back to homepage">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={46}
              height={46}
              className="program-login__logo-image"
            />
          </Link>

          <div className="program-login__content">
            <div className="program-login__copy">
              <p className="program-login__eyebrow">Member Access</p>
              <h1 className="program-login__title">
                Sign in to your <span>Protocol</span>
              </h1>
              <p className="program-login__subtitle">
                Access your dashboard, check your recommendations, and continue your transformation plan.
              </p>
              <div className="program-login__meta">
                <p>Secure member area</p>
                <p>Body analysis, protocol, support</p>
              </div>
            </div>

            <div className="program-login__card">
              <div className="program-login__card-top">
                <p className="program-login__card-eyebrow">Welcome back</p>
                <h2>Login</h2>
              </div>

              <form className="program-login__form">
                <label className="program-login__field">
                  <span>Email</span>
                  <input type="email" placeholder="you@example.com" />
                </label>

                <label className="program-login__field">
                  <span>Password</span>
                  <input type="password" placeholder="Enter your password" />
                </label>

                <button type="button" className="program-login__submit">
                  Sign In
                </button>
              </form>

              <div className="program-login__links">
                <a href="/">Back to homepage</a>
                <a href="/checkout?funnel=main">Need access?</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

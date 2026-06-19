"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { toAuthErrorMessage } from "@/lib/auth/errors";


// ─── Sub-componente extraído ───────────────────────────────────────────────
type SubmitButtonProps = {
  loading: boolean;
  disabled: boolean;
  isResetView: boolean;
  submitHover: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function SubmitButton({ loading, disabled, isResetView, submitHover, onMouseEnter, onMouseLeave }: SubmitButtonProps) {
  const label = isResetView ? "Enviar enlace de recuperación" : "Acceder";
  const bgClass = disabled
    ? "opacity-50 cursor-not-allowed bg-build-accent/50"
    : submitHover
    ? "bg-build-accent/90 lg:bg-build-main/90"
    : "bg-build-accent lg:bg-build-main";

  return (
    <button
      type="submit"
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`h-11 w-full text-build-main lg:text-build-bg rounded-xl font-bold text-[15px] tracking-wide transition-all duration-200 shadow-sm flex items-center justify-center gap-2 border-none lg:h-[44px] active:scale-[0.98] ${bgClass}`}
    >
      {loading ? (
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <span className="flex items-center gap-1.5">
          {label}
          <span className={`transition-transform duration-300 ${submitHover ? "translate-x-1" : ""}`}>→</span>
        </span>
      )}
    </button>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
type LoginFormProps = {
  redirectTo?: string;
};

function useLoginFormLogic(redirectTo: string) {
  const router = useRouter();
  const { loginEmail, loginGoogle, resetPassword, isAuthenticated, isLoading: authLoading, perfil, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetView, setIsResetView] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && perfil) {
      if (perfil.tipoUsuario === "CLIENTE") {
        logout().then(() => {
          setError("El acceso para clientes ha sido movido a un portal especializado.");
        });
      } else {
        router.replace(redirectTo);
      }
    }
  }, [authLoading, isAuthenticated, perfil, redirectTo, router, logout]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginEmail(email.trim(), pass);
    } catch (err) {
      setError(toAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResetSuccess(false);
    setLoading(true);
    try {
      if (!email) throw new Error("auth/missing-email");
      await resetPassword(email.trim());
      setResetSuccess(true);
    } catch (err) {
      setError(toAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      await loginGoogle();
    } catch (err) {
      setError(toAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    pass,
    setPass,
    loading,
    setLoading,
    showPass,
    setShowPass,
    error,
    setError,
    isResetView,
    setIsResetView,
    resetSuccess,
    setResetSuccess,
    handleSubmit,
    handleResetPassword,
    handleGoogleLogin,
  };
}

export default function LoginForm({ redirectTo = "/proyectos" }: LoginFormProps) {
  const {
    email,
    setEmail,
    pass,
    setPass,
    loading,
    showPass,
    setShowPass,
    error,
    setError,
    isResetView,
    setIsResetView,
    resetSuccess,
    setResetSuccess,
    handleSubmit,
    handleResetPassword,
    handleGoogleLogin,
  } = useLoginFormLogic(redirectTo);

  const [submitHover, setSubmitHover] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);

  // ✅ Variables pre-calculadas — eliminan ternarios del JSX
  const formTitle        = isResetView ? "Recuperar contraseña" : "Inicia sesión";
  const backLinkLabel    = isResetView ? "Volver al inicio de sesión" : "¿Olvidaste tu contraseña?";
  const inputType        = showPass ? "text" : "password";
  const visibilityIcon   = showPass ? "visibility_off" : "visibility";
  const isSubmitDisabled = loading || !email || (!isResetView && !pass);
  const handleFormSubmit = isResetView ? handleResetPassword : handleSubmit;

  const googleBgClass = loading
    ? "opacity-60 cursor-not-allowed bg-transparent"
    : googleHover
    ? "bg-build-accent/10"
    : "bg-transparent";

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ─── Left panel: Branding ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-build-main flex-col justify-between p-14 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(157,153,144,0.4)_0%,transparent_60%),radial-gradient(circle_at_80%_70%,rgba(157,153,144,0.2)_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full border border-build-accent/20 -mr-32 -mb-32" />
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full border border-build-accent/10 -ml-20 -mt-20" />
        </div>

        <div className="relative z-10 mb-8">
          <img src="/logo_llosa.png" alt="Llosa Logo" className="w-[180px] object-contain brightness-0 invert" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="w-12 h-0.5 bg-build-accent mb-6" />
          <h1 className="text-5xl font-bold text-build-bg leading-[1.2] mb-6 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Gestiona tus<br />
            <span className="text-arch-gold">proyectos.</span>
          </h1>
          <p className="text-base text-build-bg/80 leading-relaxed">
            Plataforma integral para administrar proyectos inmobiliarios, clientes, contratos y pagos desde un solo lugar.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {[
            { value: "+500", label: "Propietarios activos" },
            { value: "12",   label: "Proyectos en marcha" },
            { value: "99%",  label: "Satisfacción" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-arch-gold leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {s.value}
              </p>
              <p className="text-[13px] text-blue-300 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right panel: Form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 bg-build-main lg:bg-build-bg min-h-screen w-full lg:w-1/2">
        <div className="w-full max-w-sm flex flex-col">

          <div className="mb-8 mt-6 lg:hidden flex justify-center">
            <img src="/logo_llosa.png" alt="Llosa Logo" className="h-12 w-auto object-contain brightness-0 invert" />
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-white/5 rounded-2xl shadow-[0_8px_40px_rgba(0,22,41,0.08)] border border-slate-100 dark:border-white/10 p-6">
            <div className="mb-7">
              <h2 className="text-3xl font-bold text-build-main dark:text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {formTitle}
              </h2>
            </div>

            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[13px] text-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            {resetSuccess && (
              <div role="alert" className="mb-4 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-[13px] text-green-800 dark:text-green-400">
                Se ha enviado un enlace de recuperación a tu correo electrónico.
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 w-full"> {/* ✅ sin ternario */}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@correo.com"
                  className="h-10 w-full px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[15px] text-build-main dark:text-white outline-none transition-all duration-200 focus:border-arch-gold focus:ring-4 focus:ring-arch-gold/20 box-border lg:h-[44px] lg:border-build-accent/30 lg:bg-build-bg lg:text-build-main lg:placeholder-build-accent/50 lg:focus:ring-build-accent/20"
                />
              </div>

              {/* Password */}
              {!isResetView && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-pass" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-pass"
                      type={inputType}
                      required
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 w-full pl-4 pr-12 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[15px] text-build-main dark:text-white outline-none transition-all duration-200 focus:border-arch-gold focus:ring-4 focus:ring-arch-gold/20 box-border lg:h-[44px] lg:border-build-accent/30 lg:bg-build-bg lg:text-build-main lg:placeholder-build-accent/50 lg:focus:ring-build-accent/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 border-none bg-transparent cursor-pointer p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {visibilityIcon} {/* ✅ sin ternario */}
                      </span>
                    </button>
                  </div>
                </div>
              )}

            
              <SubmitButton
                loading={loading}
                disabled={isSubmitDisabled}
                isResetView={isResetView}
                submitHover={submitHover}
                onMouseEnter={() => setSubmitHover(true)}
                onMouseLeave={() => setSubmitHover(false)}
              />

              {/* Divider + Google */}
              {!isResetView && (
                <>
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/15" />
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/40 shrink-0" />
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/15" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    onMouseEnter={() => setGoogleHover(true)}
                    onMouseLeave={() => setGoogleHover(false)}
                    className={`h-11 w-full border border-build-accent/30 rounded-xl text-[15px] font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] lg:h-[44px] lg:border-build-main/30 ${googleBgClass} ${loading ? "text-build-bg/50 cursor-not-allowed lg:text-build-main/50" : "text-build-bg lg:text-build-main hover:bg-build-accent/10 lg:hover:bg-build-main/5"}`} 
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Acceder con Google
                  </button>

                  <div className="mt-1 flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-white/50 mt-0.5 flex-shrink-0">mail</span>
                    <p className="text-[12px] text-slate-500 dark:text-white/60 leading-relaxed">
                      ¿Es tu primera vez? Revisa tu correo electrónico para encontrar el enlace de activación de cuenta enviado por Llosa Edificaciones.
                    </p>
                  </div>
                </>
              )}

              {/* Forgot password */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetView(!isResetView);
                    setError(null);
                    setResetSuccess(false);
                  }}
                  className="text-[12px] font-semibold text-arch-gold underline underline-offset-2 hover:text-build-main transition-colors duration-200 cursor-pointer border-none bg-transparent p-0"
                >
                  {backLinkLabel}
                </button>
              </div>

            </form>
          </div>

          <p className="text-center text-[12px] text-gray-400 mt-6">
            © 2026 Llosa Edificaciones
          </p>
        </div>
      </div>
    </div>
  );
}
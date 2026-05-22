"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { toAuthErrorMessage } from "@/lib/auth/errors";

function LlosaLogo({ size = 220, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} viewBox="0 0 260 130" fill={color} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="22" height="86" rx="2" />
      <rect x="30" y="16" width="22" height="70" rx="2" />
      <rect x="0" y="87" width="52" height="5" rx="1" />
      <text x="60" y="88" fontSize="72" fontWeight="800" fontFamily="Outfit, Manrope, Arial, sans-serif" letterSpacing="-3" fill={color}>osa</text>
      <text x="1" y="118" fontSize="13" fontWeight="600" fontFamily="Outfit, Manrope, Arial, sans-serif" letterSpacing="5.5" fill={color} opacity="0.9">EDIFICACIONES</text>
    </svg>
  );
}

type LoginFormProps = {
  redirectTo?: string;
};


export default function LoginForm({ redirectTo = "/projects" }: LoginFormProps) {
  const router = useRouter();
  const { loginEmail, loginGoogle, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [authLoading, isAuthenticated, redirectTo, router]);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitHover, setSubmitHover] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginEmail(email.trim(), pass);
      router.replace(redirectTo);
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
      router.replace(redirectTo);
    } catch (err) {
      setError(toAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ─── Left panel: Branding ─── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-black flex-col justify-between p-14 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(196,158,93,0.4)_0%,transparent_60%),radial-gradient(circle_at_80%_70%,rgba(196,158,93,0.2)_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full border border-build-accent/20 -mr-32 -mb-32" />
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full border border-build-accent/10 -ml-20 -mt-20" />
        </div>

        {/* Logo */}
        <div className="relative z-10 mb-8">
          <img
            src="/logo.jpg"
            alt="Llosa Logo"
            className="w-[180px] object-contain"
          />
        </div>

        {/* Main hero text */}
        <div className="relative z-10 max-w-lg">
          <div className="w-12 h-0.5 bg-build-accent mb-6" />
          <h1 className="text-5xl font-bold text-white leading-[1.2] mb-6 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Gestiona tus
            <br />
            <span className="text-build-accent">proyectos.</span>
          </h1>
          <p className="text-base text-blue-100 leading-relaxed">
            Plataforma integral para administrar proyectos inmobiliarios, clientes, contratos y pagos desde un solo lugar.
          </p>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {[
            { value: "+500", label: "Propietarios activos" },
            { value: "12", label: "Proyectos en marcha" },
            { value: "99%", label: "Satisfacción" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-build-accent leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {s.value}
              </p>
              <p className="text-[13px] text-blue-100 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right panel: Form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-build-bg h-screen overflow-hidden w-full lg:w-[45%]">
        {/* Mobile logo */}
        <div className="mb-8 mt-6 lg:hidden">
          <LlosaLogo size={160} color="#3C3C3B" />
        </div>

        <div className="w-full max-w-[448px]">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,22,41,0.08)] border border-white p-6">
            <div className="mb-7">
              <h2 className="text-3xl font-bold text-build-main leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Inicia sesión
              </h2>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
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
                  className="h-10 w-full px-4 rounded-xl border border-gray-200 bg-white text-[15px] text-build-main outline-none transition-all duration-200 focus:border-build-accent focus:ring-4 focus:ring-build-accent/20 box-border"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-pass" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-pass"
                    type={showPass ? "text" : "password"}
                    required
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full pl-4 pr-12 rounded-xl border border-gray-200 bg-white text-[15px] text-build-main outline-none transition-all duration-200 focus:border-build-accent focus:ring-4 focus:ring-build-accent/20 box-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 border-none bg-transparent cursor-pointer p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !email || !pass}
                onMouseEnter={() => setSubmitHover(true)}
                onMouseLeave={() => setSubmitHover(false)}
                className={`mt-1 h-11 w-full text-white rounded-xl font-bold text-[15px] tracking-wide transition-all duration-300 shadow-sm flex items-center justify-center gap-2 border-none ${
                  loading || !email || !pass
                    ? "opacity-50 cursor-not-allowed bg-build-main"
                    : submitHover
                    ? "bg-build-accent"
                    : "bg-build-main"
                }`}
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Acceder
                    <span className={`transition-transform duration-300 ${submitHover ? "translate-x-1" : ""}`}>→</span>
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-[1px] bg-slate-200" />
                <span className="text-[12px] font-semibold text-slate-400 uppercase">O</span>
                <div className="flex-1 h-[1px] bg-slate-200" />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                onMouseEnter={() => setGoogleHover(true)}
                onMouseLeave={() => setGoogleHover(false)}
                className={`h-11 w-full border border-gray-200 rounded-xl text-[15px] font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 text-build-main ${
                  loading
                    ? "opacity-60 cursor-not-allowed bg-white"
                    : googleHover
                    ? "bg-slate-50"
                    : "bg-white"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Acceder con Google
              </button>

              {/* Info callout */}
              <div className="mt-1 flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="material-symbols-outlined text-[18px] text-slate-400 mt-0.5 flex-shrink-0">mail</span>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  ¿Es tu primera vez? Revisa tu correo electrónico para encontrar el enlace de activación de cuenta enviado por Llosa Edificaciones.
                </p>
              </div>

              {/* Forgot password */}
              <div className="pt-2 text-center border-t border-slate-200">
                <button
                  type="button"
                  className="text-[12px] font-semibold text-build-accent hover:text-build-main transition-colors duration-300 cursor-pointer border-none bg-transparent p-0"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-[12px] text-gray-400 mt-6">
            © 2026 Llosa Edificaciones · <span className="hover:text-gray-600 cursor-pointer transition-colors duration-200">Privacidad</span>
          </p>
        </div>
      </div>
    </div>
  );
}

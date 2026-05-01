"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── Logo inline SVG (replica del logo Llosa) ──────── */
function LlosaLogo({ size = 220 }: { size?: number }) {
  return (
    <svg width={size} viewBox="0 0 260 130" fill="white" xmlns="http://www.w3.org/2000/svg">
      {/* Pillar 1 — primera "l" */}
      <rect x="0"  y="0"  width="22" height="86" rx="2" />
      {/* Pillar 2 — segunda "l" */}
      <rect x="30" y="16" width="22" height="70" rx="2" />
      {/* Base plate */}
      <rect x="0"  y="87" width="52" height="5"  rx="1" />
      {/* "osa" text */}
      <text
        x="60" y="88"
        fontSize="72" fontWeight="800"
        fontFamily="Manrope, Arial, sans-serif"
        letterSpacing="-3"
        fill="white"
      >osa</text>
      {/* EDIFICACIONES */}
      <text
        x="1" y="118"
        fontSize="13" fontWeight="600"
        fontFamily="Manrope, Arial, sans-serif"
        letterSpacing="5.5"
        fill="white"
        opacity="0.9"
      >EDIFICACIONES</text>
    </svg>
  );
}

export default function LoginPage() {
  const router  = useRouter();
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 1400);
  }

  function handleGoogleLogin() {
    setLoading(true);
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 900);
  }

  return (
    <div className="min-h-screen flex font-['Manrope',sans-serif] animate-fade-in">

      {/* ── Left panel ─────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[55%] bg-[#050a0e] flex-col items-center justify-center p-16 overflow-hidden">

        {/* Architectural grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(2,49,67,0.45),transparent)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-10">
            <LlosaLogo size={240} />
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-white/20 mb-8" />

          {/* Tagline */}
          <p className="text-white/40 text-[13px] font-semibold uppercase tracking-[0.2em]">
            Plataforma de Gestión Inmobiliaria
          </p>

          {/* Feature pills */}
          <div className="flex gap-3 mt-10">
            {["Contratos", "Proyectos", "Clientes", "Analítica"].map(f => (
              <span key={f} className="text-[11px] font-semibold text-white/30 border border-white/10 px-3 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom left copyright */}
        <p className="absolute bottom-6 left-8 text-[11px] text-white/20 font-medium">
          © 2024 Llosa Edificaciones
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 bg-[#050a0e] rounded-2xl p-6">
          <LlosaLogo size={160} />
        </div>

        <div className="w-full max-w-[360px] animate-slide-up">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-[28px] font-bold text-[#1a1c1d] tracking-tight">Bienvenido</h2>
            <p className="text-[14px] text-[#72787c] mt-1">Inicia sesión en el Portal Backoffice</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mb-4 py-3 border border-[#e2e2e4] rounded-xl text-[14px] font-semibold text-[#1a1c1d] hover:bg-[#f9f9fb] disabled:opacity-70 transition-all flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C17 3.3 14.7 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.7H12z"/>
            </svg>
            Acceder con Google
          </button>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72787c] text-[18px]">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@llosa.com"
                  className="w-full pl-10 pr-4 py-3 border border-[#e2e2e4] rounded-xl text-[14px] text-[#1a1c1d] placeholder:text-[#c1c7cc] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[12px] font-bold text-[#41484c] uppercase tracking-wider">
                  Contraseña
                </label>
                <button type="button" className="text-[12px] font-semibold text-[#023143] hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72787c] text-[18px]">lock</span>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-[#e2e2e4] rounded-xl text-[14px] text-[#1a1c1d] placeholder:text-[#c1c7cc] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#72787c] hover:text-[#023143] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">{showPass ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-[#023143] hover:bg-[#001b27] disabled:opacity-70 text-white font-bold text-[14px] rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(2,49,67,0.35)]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Iniciando sesión…
                </>
              ) : (
                <>
                  Ingresar
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-[#c1c7cc] mt-10">
            Protegido por la política de seguridad de Llosa Edificaciones
          </p>
        </div>
      </div>
    </div>
  );
}

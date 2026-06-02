export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center py-6 px-8 w-full">
      <p className="text-xs tracking-wide uppercase text-slate-400 dark:text-white/50">
        © 2026 Llosa Edificaciones. Todos los derechos reservados.
      </p>
      <div className="flex gap-6">
        <a href="#" className="text-xs tracking-wide uppercase text-slate-400 dark:text-white/50 hover:text-slate-900 dark:text-white underline transition-colors">Privacidad</a>
        <a href="#" className="text-xs tracking-wide uppercase text-slate-400 dark:text-white/50 hover:text-slate-900 dark:text-white underline transition-colors">Términos</a>
        <a href="#" className="text-xs tracking-wide uppercase text-slate-400 dark:text-white/50 hover:text-slate-900 dark:text-white underline transition-colors">Soporte</a>
      </div>
    </footer>
  );
}

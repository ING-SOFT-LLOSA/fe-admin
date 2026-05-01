export default function Footer() {
  return (
    <footer className="w-full py-4 mt-auto border-t border-[#E5E7EB] bg-[#F9FAFB] text-slate-400 text-xs flex justify-between items-center px-8">
      <div>© 2024 Llosa Edificaciones. Todos los derechos reservados.</div>
      <div className="flex gap-4">
        <a href="#" className="text-[#023143] underline hover:opacity-70">Política de Privacidad</a>
        <a href="#" className="text-[#023143] underline hover:opacity-70">Términos de Servicio</a>
        <a href="#" className="text-[#023143] underline hover:opacity-70">Soporte</a>
      </div>
    </footer>
  );
}

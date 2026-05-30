export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-build-main">Llosa Edificaciones</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Portal del Cliente</span>
          <div className="w-8 h-8 rounded-full bg-build-main text-white flex items-center justify-center font-bold">
            C
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

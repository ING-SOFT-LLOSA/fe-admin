export default function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-white/5/80 backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-build-main/10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-build-main border-t-transparent"></div>
      </div>
      <h3 className="mt-4 text-lg font-bold text-build-main dark:text-white">{message}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-white/60 max-w-[280px] text-center">
        Por favor no cierres ni recargues la página mientras se procesan los datos en el servidor.
      </p>
    </div>
  );
}

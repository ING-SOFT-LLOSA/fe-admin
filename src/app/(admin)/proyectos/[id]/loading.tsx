export default function ProjectDetailLoading() {
  return (
    <>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e2e2e4] bg-white dark:bg-white/5 p-6">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton mt-4 h-8 w-72" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-[#e2e2e4] bg-white dark:bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-20 w-full md:col-span-2" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      </div>
    </>
  );
}

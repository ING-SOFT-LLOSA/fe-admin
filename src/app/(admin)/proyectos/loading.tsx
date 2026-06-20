export default function ProjectsLoading() {
  return (
    <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="skeleton h-9 w-48" />
            <div className="skeleton mt-3 h-5 w-80" />
          </div>
        </div>
        {["l1", "l2", "l3"].map((key) => (
          <div key={key} className="rounded-xl border border-[#e2e2e4] bg-white dark:bg-white/5 p-5">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-3 h-7 w-56" />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
            </div>
          </div>
        ))}
      </div>
  );
}

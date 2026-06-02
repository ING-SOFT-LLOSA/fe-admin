import SideNav from "@/components/SideNav";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-white/5 antialiased tracking-tight">
      <div className="min-h-screen md:flex">
        <SideNav />
        <div className="bg-white dark:bg-white/5 flex min-w-0 flex-1 flex-col md:ml-72">
          <TopNav />
          <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 py-8 md:px-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
import SideNav from "./SideNav";
import TopNav from "./TopNav";
import Footer from "./Footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f9f9fb]">
      <SideNav />
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        <TopNav />
        <main className="flex-1 p-8 flex flex-col gap-5">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
import EmployeeSideNav from "@/components/EmployeeSideNav";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

export default function EmployeeRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f9f9fb]">
      <EmployeeSideNav />
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

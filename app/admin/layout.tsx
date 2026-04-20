"use client";

import { useRouter } from "next/navigation";
import { AdminHeaderWithNotifications } from "@/components/admin-header-with-notifications";
import { AdminSidebarWithNotifications } from "@/components/admin-sidebar-with-notifications";
import { AdminFooter } from "./components/footer";
import { AdminBreadcrumbs } from "./components/breadcrumbs";
import { AdminNavigationProvider, useAdminNavigation } from "./contexts/admin-navigation-context";
import { AdminSection } from "./components/sidebar";
import { BreadcrumbsProvider } from "./contexts/breadcrumbs-context";

function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { active, setActive } = useAdminNavigation();

  const handleSelectSection = (section: AdminSection) => {
    setActive(section);

    if (section === "dashboard") {
      router.push("/admin");
      return;
    }

    router.push(`/admin?section=${section}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground flex flex-col">
      <AdminHeaderWithNotifications />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <AdminSidebarWithNotifications active={active} onSelect={handleSelectSection} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 overflow-auto min-h-0">
          <AdminBreadcrumbs />
          {children}
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminNavigationProvider>
      <BreadcrumbsProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </BreadcrumbsProvider>
    </AdminNavigationProvider>
  );
}

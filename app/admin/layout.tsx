"use client";

import { AdminHeader } from "./components/header";
import { AdminSidebar } from "./components/sidebar";
import { AdminFooter } from "./components/footer";
import { AdminBreadcrumbs } from "./components/breadcrumbs";
import { AdminNavigationProvider, useAdminNavigation } from "./contexts/admin-navigation-context";
import { BreadcrumbsProvider } from "./contexts/breadcrumbs-context";

function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { active, setActive } = useAdminNavigation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground flex flex-col">
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <AdminSidebar active={active} onSelect={setActive} />
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

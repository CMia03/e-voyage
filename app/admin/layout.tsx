"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { AdminHeaderWithNotifications } from "@/components/admin-header-with-notifications";
import { AdminFooter } from "./components/footer";
import { AdminBreadcrumbs } from "./components/breadcrumbs";
import { AdminNavigationProvider, useAdminNavigation } from "./contexts/admin-navigation-context";
import { AdminSection, AdminSidebar } from "./components/sidebar";
import { BreadcrumbsProvider } from "./contexts/breadcrumbs-context";
import { ExtraActionsProvider, useExtraActions } from "./contexts/extra-actions-context";

function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { active, setActive } = useAdminNavigation();
  const { extraActions } = useExtraActions();

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
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <AdminHeaderWithNotifications />
      </Suspense>
      <div className="mx-auto flex w-full flex-1">
        <AdminSidebar active={active} onSelect={handleSelectSection} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 overflow-auto min-h-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <AdminBreadcrumbs noMargin />
            </div>
            {extraActions && (
              <div className="flex flex-nowrap gap-2 overflow-x-auto">
                {extraActions}
              </div>
            )}
          </div>
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
        <ExtraActionsProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </ExtraActionsProvider>
      </BreadcrumbsProvider>
    </AdminNavigationProvider>
  );
}

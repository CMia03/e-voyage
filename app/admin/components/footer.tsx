import { BrandLogo } from "@/components/brand-logo";

export function AdminFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <span className="inline-flex items-center gap-2">
          <BrandLogo className="h-8 w-20" />
          <span>Admin</span>
        </span>
        <span>Internal tools</span>
      </div>
    </footer>
  );
}

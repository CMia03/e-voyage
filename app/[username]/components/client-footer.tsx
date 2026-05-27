import { BrandLogo } from "@/components/brand-logo";

export function ClientFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <BrandLogo className="h-8 w-20" />
        <span>Espace client</span>
      </div>
    </footer>
  );
}


"use client";

import { CalendarDays, Compass, CreditCard, UserRound, TrendingUp } from "lucide-react";

export type ClientSection = "simulation" | "destinations" | "planifications" | "reservations" | "profile";

export function ClientSidebar({
  active,
  onSelect,
}: {
  active: ClientSection;
  onSelect: (value: ClientSection) => void;
}) {
  return (
    <aside className="hidden w-72 border-r border-border/50 bg-card/50 p-5 md:block">
      <nav className="space-y-2">
        {/* Simulation - en premier */}
        <SidebarButton 
          active={active === "simulation"} 
          icon={<TrendingUp className="size-4" />} 
          label="Simulation budget" 
          onClick={() => onSelect("simulation")} 
        />
        
        <SidebarButton 
          active={active === "destinations"} 
          icon={<Compass className="size-4" />} 
          label="Liste destinations" 
          onClick={() => onSelect("destinations")} 
        />
        
        <SidebarButton 
          active={active === "planifications"} 
          icon={<CalendarDays className="size-4" />} 
          label="Planifications" 
          onClick={() => onSelect("planifications")} 
        />
        
        <SidebarButton 
          active={active === "reservations"} 
          icon={<CreditCard className="size-4" />} 
          label="Réservations" 
          onClick={() => onSelect("reservations")} 
        />
        
        <SidebarButton 
          active={active === "profile"} 
          icon={<UserRound className="size-4" />} 
          label="Profil" 
          onClick={() => onSelect("profile")} 
        />
      </nav>
    </aside>
  );
}

function SidebarButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
        active ? "bg-emerald-500/10 font-medium text-emerald-700" : "text-muted-foreground hover:bg-primary/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
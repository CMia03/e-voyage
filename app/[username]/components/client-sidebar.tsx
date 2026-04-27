import Link from "next/link";
import { CalendarDays, Compass, CreditCard, TrendingUp, UserRound } from "lucide-react";

export type ClientSection = "simulation" | "destinations" | "planifications" | "reservations" | "profile";

type ClientSidebarProps =
  | {
      active: ClientSection;
      onSelect: (value: ClientSection) => void;
      username?: never;
    }
  | {
      active: ClientSection;
      username: string;
      onSelect?: never;
    };

const items: Array<{ key: ClientSection; label: string; href: string; icon: React.ReactNode }> = [
  {
    key: "simulation",
    label: "Simulation budget",
    href: "simulation",
    icon: <TrendingUp className="size-4" />,
  },
  {
    key: "destinations",
    label: "Liste destinations",
    href: "destinations",
    icon: <Compass className="size-4" />,
  },
  {
    key: "planifications",
    label: "Planifications",
    href: "planifications",
    icon: <CalendarDays className="size-4" />,
  },
  {
    key: "reservations",
    label: "Reservations",
    href: "reservations",
    icon: <CreditCard className="size-4" />,
  },
  {
    key: "profile",
    label: "Profil",
    href: "profile",
    icon: <UserRound className="size-4" />,
  },
];

export function ClientSidebar(props: ClientSidebarProps) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 self-start overflow-y-auto border-r border-border/50 bg-card/50 p-5 md:block">
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = props.active === item.key;

          if ("username" in props) {
            return (
              <Link
                key={item.key}
                href={`/${props.username}/${item.href}`}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-emerald-500/10 font-medium text-emerald-700"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => props.onSelect(item.key)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                isActive
                  ? "bg-emerald-500/10 font-medium text-emerald-700"
                  : "text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

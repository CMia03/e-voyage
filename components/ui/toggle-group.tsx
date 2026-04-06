import * as React from "react";

import { cn } from "@/lib/utils";

type ToggleGroupContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
};

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  value: undefined,
  onValueChange: undefined,
});

type ToggleGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  type?: "single";
  value?: string;
  onValueChange?: (value: string) => void;
};

function ToggleGroup({
  className,
  value,
  onValueChange,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div
        role="group"
        data-slot="toggle-group"
        className={cn("inline-flex items-center gap-1", className)}
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

type ToggleGroupItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

function ToggleGroupItem({
  className,
  value,
  children,
  type = "button",
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);
  const isActive = context.value === value;

  return (
    <button
      type={type}
      data-slot="toggle-group-item"
      data-state={isActive ? "on" : "off"}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        className
      )}
      onClick={() => context.onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export { ToggleGroup, ToggleGroupItem };

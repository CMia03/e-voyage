"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground",
        success:
          "fixed right-6 top-24 z-[80] w-[min(520px,calc(100vw-2rem))] border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xl shadow-emerald-900/10 animate-in fade-in-50 slide-in-from-top-3",
        destructive:
          "fixed right-6 top-24 z-[80] w-[min(520px,calc(100vw-2rem))] border-red-300 bg-red-50 text-red-800 shadow-xl shadow-red-900/10 animate-in fade-in-50 slide-in-from-top-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const effectiveVariant =
    variant ??
    (typeof className === "string" && className.includes("emerald")
      ? "success"
      : typeof className === "string" && className.includes("red")
        ? "destructive"
        : undefined);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    setVisible(true);

    if (effectiveVariant !== "success" && effectiveVariant !== "destructive") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [effectiveVariant, props.children]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant: effectiveVariant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    <h5 className={cn("font-medium tracking-tight", className)} {...props} />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("text-sm", className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle };

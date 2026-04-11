"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="text-xl font-semibold">
            Cool Voyage Admin
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/">Retour au site</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
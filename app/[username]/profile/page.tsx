"use client";

import { useMemo } from "react";
import { loadAuth } from "@/lib/auth";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

export default function ClientProfilePage() {
  const session = useMemo(() => loadAuth(), []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Profil</h1>
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Login" value={session?.login || "-"} />
          <InfoItem label="Role" value={session?.role || "-"} />
          <InfoItem label="Nom" value={session?.nom || "-"} />
          <InfoItem label="Prenom" value={session?.prenom || "-"} />
        </dl>
      </div>
    </section>
  );
}

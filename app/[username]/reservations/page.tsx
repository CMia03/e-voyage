"use client";

export default function ReservationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mes réservations</h1>
      <p className="text-sm text-muted-foreground">
        Consultez et gérez vos réservations de voyage.
      </p>
      <div className="rounded-xl border border-dashed border-border/70 bg-card p-6 text-center">
        <p className="text-muted-foreground">Aucune réservation pour le moment.</p>
      </div>
    </div>
  );
}
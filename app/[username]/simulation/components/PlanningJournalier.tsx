// app/[username]/simulation/components/PlanningJournalier.tsx
"use client";

import { JourSimulation, ElementSimulation } from "@/lib/type/simulation.types";

type PlanningJournalierProps = {
    jours: JourSimulation[];
    elementsSelectionnes: string[];
    onToggleElement: (elementId: string) => void;
};

export function PlanningJournalier({ jours, elementsSelectionnes, onToggleElement }: PlanningJournalierProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Planning journalier</h2>

            {jours.map((jour) => (
                <div key={jour.numeroJour} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                        <h3 className="font-semibold">
                            📅 Jour {jour.numeroJour} - {jour.titre || "Sans titre"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Total: {jour.totalJour.toLocaleString()} Ar
                        </p>
                    </div>

                    <div className="divide-y">
                        {jour.elements.map((element: ElementSimulation) => {
                            const estCoche = elementsSelectionnes.includes(element.id);

                            return (
                                <div
                                    key={element.id}
                                    className={`p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer ${
                                        estCoche ? "bg-emerald-50/30" : ""
                                    }`}
                                    onClick={() => onToggleElement(element.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={estCoche}
                                            onChange={() => onToggleElement(element.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={element.obligatoire}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <div>
                                            <p className="font-medium">{element.titre}</p>
                                            <p className="text-xs text-gray-500">
                                                {element.type}
                                                {element.obligatoire && (
                                                    <span className="ml-2 text-emerald-600">(Obligatoire)</span>
                                                )}
                                            </p>
                                            {element.details?.duree && (
                                                <p className="text-xs text-gray-400">⏱️ {element.details.duree}</p>
                                            )}
                                            {element.details?.capacite && (
                                                <p className="text-xs text-gray-400">👥 Capacité: {element.details.capacite} pers</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-medium">{element.prix.toLocaleString()} Ar</p>
                                        {element.details?.prixParPersonne && (
                                            <p className="text-xs text-gray-500">
                                                {element.details.prixParPersonne.toLocaleString()} Ar/pers
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
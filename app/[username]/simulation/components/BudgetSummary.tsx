// app/[username]/simulation/components/BudgetSummary.tsx
"use client";

type BudgetSummaryProps = {
    totalCoche: number;
    budgetClient: number;
    adminBudget?: number | null;
    reste: number;
    totalObligatoire: number;
    totalOptionnel: number;
    seuilMinimum: number;
};

export function BudgetSummary({
    totalCoche,
    budgetClient,
    adminBudget,
    reste,
    totalObligatoire,
    totalOptionnel,
    seuilMinimum,
}: BudgetSummaryProps) {
    const pourcentage = budgetClient > 0 ? (totalCoche / budgetClient) * 100 : 0;
    const estDansBudget = reste >= 0;
    const hasMinimumBudget = seuilMinimum > 0;
    const minimumBudget = hasMinimumBudget ? seuilMinimum : 0;
    const maxBudget =
        adminBudget && adminBudget > 0
            ? adminBudget
            : Math.max(budgetClient, totalCoche, minimumBudget, 1);
    const budgetRange = Math.max(maxBudget - minimumBudget, 1);
    const clampedBudgetClient = Math.min(Math.max(budgetClient, minimumBudget), maxBudget);
    // const budgetClientRatio = ((clampedBudgetClient - minimumBudget) / budgetRange) * 100;

    const  budgetClientRatio = ((Math.max(totalCoche, minimumBudget) - minimumBudget) / budgetRange) * 100;

    console.log("///////////////////////////Reste est dans le Budgé ///////////////////////////////////")
    console.log(reste);


    return (
        <div className="space-y-3 rounded-lg border bg-white p-4">
            <h3 className="font-semibold">Recapitulatif du budget</h3>

            <div>
                <div className="mb-1 flex justify-between text-sm">
                    <span>{hasMinimumBudget ? `${minimumBudget.toLocaleString()} Ar` : "A calculer"}</span>
                    <span>{maxBudget.toLocaleString()} Ar</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                        className="absolute inset-y-0 z-10 w-1 rounded-full bg-slate-900"
                        style={{ left: `${budgetClientRatio}%` }}
                    />


                    

                    {/* <div
                        className={`h-full transition-all ${estDansBudget ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, pourcentage)}%` }}
                    /> */}


                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>
                        Budget minimum accepte: {hasMinimumBudget ? `${minimumBudget.toLocaleString()} Ar` : "A calculer"}
                    </span>
                    <span>Budget maximal admin: {maxBudget.toLocaleString()} Ar</span>
                </div>
            </div>

            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Total selectionne :</span>
                    <span className="font-medium">{totalCoche.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Dont obligatoire :</span>
                    <span>{totalObligatoire.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Dont optionnel :</span>
                    <span>{totalOptionnel.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Budget minimum :</span>
                    <span>{seuilMinimum.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Reste :</span>
                    <span className={`font-bold ${estDansBudget ? "text-emerald-600" : "text-red-600"}`}>
                        {reste.toLocaleString()} Ar
                    </span>
                </div>
            </div>
        </div>
    );
}

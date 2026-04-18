// app/[username]/simulation/components/ActionButtons.tsx
"use client";

type ActionButtonsProps = {
    onToutCocher: () => void;
    onToutDecocher: () => void;
};

export function ActionButtons({ onToutCocher, onToutDecocher }: ActionButtonsProps) {
    return (
        <div className="flex gap-3">
            <button
                onClick={onToutCocher}
                className="px-4 py-2 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
            >
                ✅ Tout cocher
            </button>
            <button
                onClick={onToutDecocher}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
                ❌ Tout décocher
            </button>
        </div>
    );
}
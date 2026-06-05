"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ImageGalleryState = {
  title: string;
  images: string[];
  activeIndex: number;
};

type ImageGalleryDialogProps = {
  gallery: ImageGalleryState | null;
  onChange: (gallery: ImageGalleryState | null) => void;
  description?: string;
};

export function ImageGalleryDialog({
  gallery,
  onChange,
  description = "Images associees au bloc selectionne.",
}: ImageGalleryDialogProps) {
  const activeImage = gallery?.images?.[gallery.activeIndex] ?? "";

  return (
    <Dialog open={Boolean(gallery)} onOpenChange={(open) => !open && onChange(null)}>
      <DialogContent className="!h-[92vh] !w-[94vw] !max-w-[1200px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 sm:!max-w-[1200px]">
        <DialogHeader className="border-b border-slate-200 bg-slate-50/90 px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {gallery?.title ?? "Images du bloc"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="h-[calc(92vh-96px)] overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.94),_rgba(255,255,255,0.98))] px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <section className="rounded-[30px] border border-slate-200/90 bg-white/92 p-5 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.45)]">
              <div className="flex h-[48vh] min-h-[300px] items-center justify-center overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.94),_rgba(30,41,59,0.96))] p-5 sm:h-[54vh]">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={`${gallery?.title ?? "Bloc"} ${(gallery?.activeIndex ?? 0) + 1}`}
                    width={1200}
                    height={760}
                    className="max-h-full w-auto max-w-full rounded-[18px] object-contain shadow-[0_24px_55px_-30px_rgba(15,23,42,0.85)] transition duration-300 hover:scale-[1.03]"
                    unoptimized
                  />
                ) : (
                  <p className="text-sm text-slate-300">Aucune image disponible.</p>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{gallery?.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                    Image {(gallery?.activeIndex ?? 0) + 1} sur {gallery?.images.length ?? 0}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Survolez l&apos;image pour l&apos;agrandir legerement.
                </p>
              </div>
            </section>

            {(gallery?.images.length ?? 0) > 1 ? (
              <aside className="rounded-[28px] border border-slate-200/90 bg-white/88 p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Galérie
                </p>
                <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1">
                  {(gallery?.images ?? []).map((image, index) => {
                    const isActive = index === gallery?.activeIndex;
                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() =>
                          onChange(gallery ? { ...gallery, activeIndex: index } : gallery)
                        }
                        className={`overflow-hidden rounded-2xl border bg-white text-left transition ${
                          isActive
                            ? "border-emerald-400 ring-2 ring-emerald-200"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${gallery?.title ?? "Bloc"} miniature ${index + 1}`}
                          width={260}
                          height={150}
                          className="h-24 w-full object-cover"
                          unoptimized
                        />
                        <div className="px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Image {index + 1}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

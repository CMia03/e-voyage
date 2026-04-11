"use client";

import dynamic from "next/dynamic";

export const HeaderDynamic = dynamic(
  () => import("@/components/header").then((mod) => mod.Header),
  {
    ssr: false,
  }
);


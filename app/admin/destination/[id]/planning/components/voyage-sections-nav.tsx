"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanningSection, sectionOptions } from "../planning-sections.config";

type Props = {
  selectedSection: PlanningSection;
  description: string;
  onSelectSection: (section: PlanningSection) => void;
};

export function VoyageSectionsNav({ selectedSection, description, onSelectSection }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <CardHeader>
      <CardTitle>Sections du voyage</CardTitle>
      <CardDescription>{description}</CardDescription>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {sectionOptions.map((section) => {
          const Icon = section.icon;
          const params = new URLSearchParams(searchParams.toString());
          params.set("section", section.id);
          const href = `${pathname}?${params.toString()}`;

          return (
            <Button
              key={section.id}
              asChild
              variant={selectedSection === section.id ? "default" : "outline"}
              className="justify-start"
            >
              <Link href={href} onClick={() => onSelectSection(section.id)}>
                <Icon className="size-4" />
                {section.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </CardHeader>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanningSection, sectionOptions } from "../planning-sections.config";

type Props = {
  selectedSection: PlanningSection;
  description: string;
  onSelectSection: (section: PlanningSection) => void;
};

export function VoyageSectionsNav({ selectedSection, description, onSelectSection }: Props) {
  return (
    <CardHeader>
      <CardTitle>Sections du voyage</CardTitle>
      <CardDescription>{description}</CardDescription>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {sectionOptions.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              type="button"
              variant={selectedSection === section.id ? "default" : "outline"}
              className="justify-start"
              onClick={() => onSelectSection(section.id)}
            >
              <Icon className="size-4" />
              {section.label}
            </Button>
          );
        })}
      </div>
    </CardHeader>
  );
}

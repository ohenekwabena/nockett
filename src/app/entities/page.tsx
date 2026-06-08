"use client";

import { ReferenceListCard } from "@/components/reference-list/reference-list-card";
import { referenceDescriptors } from "@/components/reference-list/descriptor";

export default function EntitiesPage() {
  return (
    <div className="pr-6 mt-10">
      <h1
        className="font-bold mb-4 text-gray-900 dark:text-gray-100"
        style={{
          fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)",
        }}
      >
        Entities
      </h1>
      {/* Each reference list is one descriptor entry — see reference-list/descriptor.ts */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 w-full">
        {referenceDescriptors.map((descriptor) => (
          <ReferenceListCard key={descriptor.key} descriptor={descriptor} />
        ))}
      </div>
    </div>
  );
}

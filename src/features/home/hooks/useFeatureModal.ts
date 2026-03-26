"use client";

import { useEffect, useMemo, useState } from "react";
import type { Feature } from "../types";

export function useFeatureModal() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  useEffect(() => {
    if (!selectedFeature) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedFeature(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedFeature]);

  const selectedFeatureTitle = useMemo(
    () => selectedFeature?.title ?? "",
    [selectedFeature]
  );

  return {
    selectedFeature,
    selectedFeatureTitle,
    openFeature: setSelectedFeature,
    closeFeature: () => setSelectedFeature(null),
  };
}

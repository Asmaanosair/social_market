"use client";

import { useComposeStore } from "@/lib/stores/compose.store";
import { validateAllPlatforms } from "@/lib/utils/validators";

export function useCompose() {
  const store = useComposeStore();

  const validationResults = validateAllPlatforms(
    store.selectedPlatforms,
    store.content,
    store.media.length > 0 ? store.media : undefined
  );

  const isValid = Object.values(validationResults).every((r) => r.valid);

  const canPublish =
    store.content.trim().length > 0 &&
    store.selectedPlatforms.length > 0 &&
    isValid;

  const characterCounts = Object.fromEntries(
    store.selectedPlatforms.map((p) => {
      const override = store.platformOverrides[p];
      const text = override?.text ?? store.content;
      return [p, text.length];
    })
  );

  return {
    ...store,
    validationResults,
    isValid,
    canPublish,
    characterCounts,
  };
}

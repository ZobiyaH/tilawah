import React from "react";
import { TajweedAnnotation } from "../../types";

interface TajweedLayerProps {
  annotations?: TajweedAnnotation[];
  showTajweed: boolean;
  children: React.ReactNode;
}

export default function TajweedLayer({ annotations, showTajweed, children }: TajweedLayerProps) {
  if (!showTajweed || !annotations || annotations.length === 0) {
    return <>{children}</>;
  }

  const primaryRule = annotations[0].rule;
  let decorationClass = "";

  // Assign border guidelines matching colors in Section 2:
  // - Ghunna (nasal): yellow underline
  // - Madd (elongation): blue underline
  // - Qalqala (echo): red underline
  // - Idgham (merging): green underline
  // - Ikhfa (hiding): purple underline
  if (primaryRule === "ghunna") {
    decorationClass = "border-b-2 border-yellow-500/80";
  } else if (primaryRule === "madd") {
    decorationClass = "border-b-2 border-sky";
  } else if (primaryRule === "qalqala") {
    decorationClass = "border-b-2 border-ruby";
  } else if (primaryRule === "idgham") {
    decorationClass = "border-b-2 border-emerald-light";
  } else if (primaryRule === "ikhfa") {
    decorationClass = "border-b-2 border-purple-500/80";
  }

  return (
    <span className={decorationClass} title={`${primaryRule.toUpperCase()}: ${annotations[0].description}`}>
      {children}
    </span>
  );
}

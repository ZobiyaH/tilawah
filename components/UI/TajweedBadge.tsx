import React from "react";
import clsx from "clsx";

interface TajweedBadgeProps {
  rule: string;
  className?: string;
}

export default function TajweedBadge({ rule, className }: TajweedBadgeProps) {
  const normRule = rule.toLowerCase();
  
  let colorClass = "bg-gold-pale border-gold text-yellow-800 dark:text-yellow-200"; // default
  if (normRule.includes("ghunna")) {
    colorClass = "bg-amber-100 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-300";
  } else if (normRule.includes("madd")) {
    colorClass = "bg-sky-pale dark:bg-sky-950/40 border-sky text-sky dark:text-sky-300";
  } else if (normRule.includes("qalqala")) {
    colorClass = "bg-ruby-pale dark:bg-ruby-950/40 border-ruby text-ruby dark:text-ruby-300";
  } else if (normRule.includes("idgham")) {
    colorClass = "bg-emerald-pale dark:bg-emerald-950/40 border-emerald text-emerald dark:text-emerald-300";
  } else if (normRule.includes("ikhfa")) {
    colorClass = "bg-purple-100 dark:bg-purple-950/40 border-purple-500 text-purple-800 dark:text-purple-300";
  }

  return (
    <span
      className={clsx(
        "inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider border transition-colors",
        colorClass,
        className
      )}
    >
      {rule}
    </span>
  );
}

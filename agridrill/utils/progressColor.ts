import { type CardTone } from "@/types/dashboard";

/** Tailwind bg-color class for a progress bar fill, based on tone. */
export function getProgressColor(tone: CardTone): string {
  switch (tone) {
    case "success":
      return "bg-emerald-500";
    case "warning":
      return "bg-amber-500";
    case "danger":
      return "bg-rose-500";
    default:
      return "bg-slate-400";
  }
}

/** Chooses a tone for a percentage value using standard battery-style thresholds. */
export function toneForPercent(value: number): CardTone {
  if (value >= 80) return "success";
  if (value >= 50) return "warning";
  return "danger";
}
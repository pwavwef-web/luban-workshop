import { getBadgeTone } from "@/lib/status";

const toneClass = {
  amber: "badge badge-amber",
  blue: "badge badge-blue",
  green: "badge badge-green",
  red: "badge badge-red",
  stone: "badge badge-stone",
  teal: "badge badge-teal",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone?: keyof typeof toneClass }) {
  const resolvedTone = tone || getBadgeTone(String(children));
  return <span className={toneClass[resolvedTone]}>{children}</span>;
}

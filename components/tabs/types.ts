import type { Inputs, Lang } from "@/lib/types";
import type { T } from "@/lib/i18n";

export interface TabProps {
  inputs: Inputs;
  update: (patch: Partial<Inputs>) => void;
  t: T;
  lang: Lang;
}

import clsx from "clsx";

export function cn(...values: Array<string | boolean | undefined | null>) {
  return clsx(values);
}


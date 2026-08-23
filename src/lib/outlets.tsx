"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Outlet = {
  id: string;
  slug: string;
  name: string;
};

export const MAX_OUTLETS = 35;

const OutletsContext = createContext<Outlet[]>([]);

export function OutletsProvider({
  outlets,
  children,
}: {
  outlets: Outlet[];
  children: ReactNode;
}) {
  return <OutletsContext.Provider value={outlets}>{children}</OutletsContext.Provider>;
}

export function useOutlets(): Outlet[] {
  return useContext(OutletsContext);
}

export function useOutletName(slug: string): string {
  const outlets = useOutlets();
  return outlets.find((o) => o.slug === slug)?.name ?? slug;
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

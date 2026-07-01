"use client";

// Lets any page open the floating AI advisor (optionally with a starting
// question). AppShell provides the implementation; pages call useAdvisor().
import { createContext, useContext } from "react";

export type AdvisorApi = { open: (question?: string) => void };
export const AdvisorCtx = createContext<AdvisorApi>({ open: () => {} });
export const useAdvisor = () => useContext(AdvisorCtx);

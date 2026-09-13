"use client";
import { create } from "zustand";
type PaywallState = { open: boolean; reason?: string; show: (reason: string) => void; hide: () => void };
export const usePaywallStore = create<PaywallState>((set) => ({ open: false, show: (reason) => set({ open: true, reason }), hide: () => set({ open: false, reason: undefined }) }));

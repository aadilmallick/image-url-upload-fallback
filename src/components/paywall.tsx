"use client";
import Link from "next/link";
import { usePaywallStore } from "./paywall-store";
export function Paywall() { const { open, reason, hide } = usePaywallStore(); if (!open) return null; return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-6"><div className="w-full max-w-md rounded-2xl border border-cyan-300/40 bg-slate-900 p-6 text-slate-100"><h2 className="text-2xl font-semibold">Upgrade to Pro</h2><p className="mt-3 text-slate-300">{reason}</p><div className="mt-6 flex gap-3"><Link className="rounded-lg bg-cyan-300 px-4 py-2 font-medium text-slate-950" href="/pricing" onClick={hide}>View plans</Link><button className="rounded-lg border border-slate-700 px-4 py-2" onClick={hide}>Not now</button></div></div></div>; }

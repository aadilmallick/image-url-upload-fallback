import Link from "next/link";

export default function Home() {
  return <main className="min-h-screen bg-slate-950 text-white"><section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20"><p className="mb-5 text-sm font-medium tracking-[0.22em] text-cyan-300">IMAGE FALLBACK</p><h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">Permanent image links, backed by more than one provider.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Upload once, replicate across your configured chain, and share one health-aware URL. If a provider is unavailable, requests transparently move to the next replica.</p><div className="mt-10 flex gap-4"><Link className="rounded-lg bg-cyan-300 px-5 py-3 font-medium text-slate-950" href="/dashboard">Open dashboard</Link><Link className="rounded-lg border border-slate-700 px-5 py-3 font-medium text-slate-200" href="/docs">API documentation</Link></div></section></main>;
}

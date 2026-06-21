"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { CatchForm } from "@/components/catch-form";

export default function Home() {
  return (
    <>
      <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/65 p-6 backdrop-blur-md sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Fishing Community · 2026
              </span>
              <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl">
                <span className="italic">Angler</span>
                <span>Hub</span>
                <span className="text-primary">.</span>
              </h1>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                Log your catch, track the conditions, and compete for the biggest fish on the leaderboard.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <ThemeToggle />
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-4 py-2 text-[13px] font-medium backdrop-blur-md hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/analysis"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-4 py-2 text-[13px] font-medium backdrop-blur-md hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Analysis
              </Link>
            </div>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[2rem] border border-border/70 bg-card/65 p-6 backdrop-blur-md sm:p-8"
        >
          <h2 className="mb-6 font-display text-2xl tracking-tight">
            Log a Catch
          </h2>
          <CatchForm />
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pb-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70"
        >
          built with Next.js · Supabase · Motion
        </motion.footer>
      </main>
    </>
  );
}
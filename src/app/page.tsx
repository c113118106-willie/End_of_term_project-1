"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import { QuestionCard } from "@/components/question-card";
import { QuestionForm } from "@/components/question-form";
import { StatsPill } from "@/components/stats-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuestions } from "@/lib/use-questions";
import { cn } from "@/lib/utils";
import Link from "next/link";


const PAGE_SIZE = 10;

export default function Home() {
  const { questions, loading, loadingMore, hasMore, error, loadMore } =
    useQuestions(PAGE_SIZE);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // æ»?é¼?è·???¨å?????ï¼???´æ?¥å¯« CSS varï¼???? React ä»????
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = spotlightRef.current;
      if (!el) return;
      el.style.setProperty("--mouse-x", `${e.clientX}px`);
      el.style.setProperty("--mouse-y", `${e.clientY}px`);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // ???åº???? DB + useQuestions hook çµ±ä??è²?è²¬ï?????è£¡ç?´æ?¥æ¸²???
  const totalLikes = useMemo(
    () => questions.reduce((sum, q) => sum + q.likes, 0),
    [questions]
  );

  return (
    <>
      <div ref={spotlightRef} className="mouse-spotlight" aria-hidden />

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {/* ============ Header ============ */}
        <motion.header
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.09, delayChildren: 0.05 },
            },
          }}
          className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/65 p-5 shadow-[0_1px_0_oklch(0.92_0.02_70_/_0.7),0_40px_80px_-44px_oklch(0.35_0.05_48_/_0.36)] backdrop-blur-md sm:p-8"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -left-14 top-0 h-52 w-52 rounded-full bg-linear-to-br from-primary/20 via-primary/8 to-transparent blur-2xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-linear-to-br from-accent/25 via-accent/10 to-transparent blur-2xl"
          />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_200px] lg:items-start">
            <div className="flex flex-col gap-5">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -6 },
              show: { opacity: 1, y: 0 },
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-block h-px w-6 bg-foreground/30" />
              <span>AI ?? ???å­? Â· 2026</span>
            </div>
            <div className="lg:hidden flex items-center gap-2">
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[12px] font-medium backdrop-blur-md hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    ? ¤jª«±Æ¦æº]
                </Link>
                <ThemeToggle />
            </div>
          </motion.div>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl"
          >
            <span className="italic">Class</span>
            <span>Wall</span>
            <span className="text-primary">.</span>
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
            className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          >
            ä¸????å±¬æ?¼é????????å®¤ç????¿å?????ç­??????????
            <span className="font-display italic text-foreground">
              ??³å??ä»?éº¼ï??å°±å¤§??¹å??
            </span>
            ??? ??³æ?????æ­¥ã?????è®?è¡?æ¦????èª°é?½ç??å¾???°ã??
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            <StatsPill label="???é¡?" value={questions.length} />
            <StatsPill label="ç¸? +1" value={totalLikes} accent />
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 backdrop-blur-md px-3 py-1.5 text-[12px]">
              <span className="live-dot" aria-hidden />
              <span className="text-muted-foreground">??³æ?????ç·?ä¸?</span>
            </span>
          </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <span className="inline-flex items-center rounded-full border border-border/65 bg-background/65 px-3 py-1 text-[11px] tracking-[0.18em] text-muted-foreground">
                  ??¿å????????
                </span>
                <span className="inline-flex items-center rounded-full border border-border/65 bg-background/65 px-3 py-1 text-[11px] tracking-[0.18em] text-muted-foreground">
                  ??³æ????´æ??
                </span>
                <span className="inline-flex items-center rounded-full border border-border/65 bg-background/65 px-3 py-1 text-[11px] tracking-[0.18em] text-muted-foreground">
                  ??¨ç?­å?¯è??
                </span>
              </motion.div>
            </div>

            <motion.aside
              variants={{
                hidden: { opacity: 0, x: 12 },
                show: { opacity: 1, x: 0 },
              }}
              className="hidden rounded-3xl border border-border/70 bg-background/55 p-4 lg:flex lg:flex-col lg:gap-4"
            >
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  ??­ç??ç¯?å¥?
                </p>
                <p className="font-display text-2xl italic leading-none">
                  Ask. Vote. Flow.
                </p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                ???é¡????ä¾???±åº¦???åº?ï¼?è®????æ­???³è¢«è¨?è«????é¡???®æµ®ä¸?ä¾????
              </p>
            </motion.aside>
          </div>
        </motion.header>

        {/* ============ ??¼å????? ============ */}
        <section aria-label="??¼å?????">
          <QuestionForm />
        </section>

        {/* ============ ???é¡????è¡? ============ */}
        <section aria-label="???é¡????è¡?" className="flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-baseline justify-between gap-3"
          >
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
              ???ä¸???????é¡?
            </h2>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              ä¾?è®???¸æ??åº? Â· æ¯???? {PAGE_SIZE} é¡?
            </span>
          </motion.div>

          {loading ? (
            <SkeletonList />
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
              è®????å¤±æ??ï¼?{error}
            </div>
          ) : questions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-border/70 bg-card/40 py-16 text-center"
            >
              <p className="font-display text-2xl italic text-muted-foreground">
                ???æ²????äººç?¼å??
              </p>
              <p className="mt-2 text-sm text-muted-foreground/80">
                ä½?ä¾???¶ç¬¬ä¸???? ???
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </AnimatePresence>

              {/* è¼???¥æ?´å?? / å·²å?°å?? */}
              <div className="pt-2 flex justify-center">
                {hasMore ? (
                  <motion.button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    whileTap={{ scale: 0.96 }}
                    whileHover={loadingMore ? undefined : { y: -1 }}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-2.5",
                      "border border-border bg-card/70 backdrop-blur-md",
                      "text-sm font-medium transition-colors duration-200",
                      "hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    {loadingMore ? (
                      <>
                        <motion.span
                          aria-hidden
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-3.5 w-3.5 rounded-full border-2 border-foreground/40 border-t-primary"
                        />
                        <span>è¼???¥ä¸­???</span>
                      </>
                    ) : (
                      <>
                        <span>è¼???¥æ?´å??</span>
                        <span aria-hidden>???</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
                    ??? æ²??????´å??äº? ???
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-8 pb-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70"
        >
          built with Next.js Â· Supabase Â· Motion
        </motion.footer>
      </main>
    </>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
          className="h-24 rounded-2xl border border-border/60 bg-card/40"
        />
      ))}
    </div>
  );
}

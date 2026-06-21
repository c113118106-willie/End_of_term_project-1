"use client";

import Link from "next/link";

import { CatchLeaderboard } from "@/components/catch-leaderboard";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LeaderboardPage() {
  return (
    <main className="relative min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              返回首頁
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🏆 大物排行榜
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                全站前五大漁獲紀錄
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <CatchLeaderboard />

      <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            2026 釣客天堂
          </p>
        </div>
      </footer>
    </main>
  );
}
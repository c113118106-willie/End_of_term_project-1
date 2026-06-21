"use client";

import { CatchLeaderboard } from "@/components/catch-leaderboard";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LeaderboardPage() {
  return (
    <main className="relative min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Catch Leaderboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Top 5 Biggest Catches
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <CatchLeaderboard />

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            ? 2024 Catch Leaderboard Platform
          </p>
        </div>
      </footer>
    </main>
  );
}

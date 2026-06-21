"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

interface Spot {
  id: string;
  name: string;
  location: string;
  water_type: string;
  description: string;
  avg_rating: number;
  review_count: number;
  tags: string[];
}

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: spotsData } = await supabase
        .from("fishing_spots")
        .select("id, name, location, water_type, description");

      if (!spotsData) { setLoading(false); return; }

      const enriched = await Promise.all(
        spotsData.map(async (spot) => {
          const [reviewRes, tagRes] = await Promise.all([
            supabase.from("spot_reviews").select("rating").eq("fishing_spot_id", spot.id),
            supabase.from("spot_tag_mapping").select("tags(tag_name)").eq("fishing_spot_id", spot.id),
          ]);
          const ratings = (reviewRes.data ?? []).map((r: any) => r.rating);
          const avg = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
          const tags = (tagRes.data ?? []).map((t: any) => t.tags?.tag_name).filter(Boolean);
          return { ...spot, avg_rating: avg, review_count: ratings.length, tags };
        })
      );
      setSpots(enriched);
      setLoading(false);
    }
    load();
  }, []);

  // 已修復：將原本亂碼的鍵值對齊資料庫特徵（海、溪、池）
  const waterTypeColor: Record<string, string> = {
    "海": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "溪": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "池": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">首頁</Link>
            <Link href="/leaderboard" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">戰績排行榜</Link>
            <Link href="/analysis" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">數據分析</Link>
            <h1 className="text-xl font-bold">熱門釣點</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="mb-2 text-2xl font-bold">全台釣點總覽</h2>
        <p className="mb-8 text-sm text-muted-foreground">點擊任意釣點即可查看詳細資訊、釣友評價以及目標魚種。</p>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-card/40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                href={`/spots/${spot.id}`}
                className="group rounded-2xl border border-border bg-card/60 p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{spot.name}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${waterTypeColor[spot.water_type] ?? ""}`}>
                    {spot.water_type}域
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">{spot.location}</p>
                {spot.description && (
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{spot.description}</p>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-sm ${s <= Math.round(spot.avg_rating) ? "text-yellow-400" : "text-muted-foreground/30"}`}>★</span>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {spot.avg_rating > 0 ? spot.avg_rating.toFixed(1) : "暫無評價"} ({spot.review_count} 則評價)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {spot.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
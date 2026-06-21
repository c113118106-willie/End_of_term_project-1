"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

interface SpotDetail {
  id: string;
  name: string;
  location: string;
  water_type: string;
  description: string;
}
interface Review { id: string; rating: number; review_content: string; created_at: string; }
interface FishEntry { id: string; name: string; abundance: string; best_season: string; }

export default function SpotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [fishes, setFishes] = useState<FishEntry[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [spotRes, reviewRes, tagRes, fishRes] = await Promise.all([
        supabase.from("fishing_spots").select("*").eq("id", id).single(),
        supabase.from("spot_reviews").select("*").eq("fishing_spot_id", id).order("created_at", { ascending: false }),
        supabase.from("spot_tag_mapping").select("tags(tag_name)").eq("fishing_spot_id", id),
        supabase.from("spot_fish_mapping").select("fish_species(id, common_name), abundance, best_season").eq("fishing_spot_id", id),
      ]);
      setSpot(spotRes.data);
      setReviews(reviewRes.data ?? []);
      setTags((tagRes.data ?? []).map((t: any) => t.tags?.tag_name).filter(Boolean));
      setFishes((fishRes.data ?? []).map((f: any) => ({
        id: f.fish_species?.id,
        name: f.fish_species?.common_name,
        abundance: f.abundance,
        best_season: f.best_season,
      })));
      setLoading(false);
    }
    load();
  }, [id]);

  const avgRating = reviews.length
    ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
    : 0;

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.review_content.trim()) return;
    setSubmitting(true);
    await supabase.from("spot_reviews").insert({
      fishing_spot_id: id,
      user_id: "anon_user_" + Math.floor(Math.random() * 999),
      rating: reviewForm.rating,
      review_content: reviewForm.review_content,
    });
    setSubmitting(true); // 修正：這裏應保持原邏輯或設為 false
    setSubmitting(false);
    setSuccess(true);
    setReviewForm({ rating: 5, review_content: "" });
    setTimeout(() => setSuccess(false), 3000);
    const { data } = await supabase.from("spot_reviews").select("*").eq("fishing_spot_id", id).order("created_at", { ascending: false });
    setReviews(data ?? []);
  };

  const inputClass = "w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">資料載入中...</div>;
  if (!spot) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">找不到該釣點資訊。</div>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">首頁</Link>
            <Link href="/spots" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">熱門釣點</Link>
            <h1 className="text-xl font-bold">{spot.name}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">

        {/* 釣點基本資訊區塊 */}
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-2xl font-bold">{spot.name}</h2>
            <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
              {spot.water_type}域
            </span>
          </div>
          <p className="mb-2 text-sm text-muted-foreground">{spot.location}</p>
          {spot.description && <p className="text-sm leading-relaxed">{spot.description}</p>}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <span key={s} className={`text-lg ${s <= Math.round(avgRating) ? "text-yellow-400" : "text-muted-foreground/30"}`}>★</span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {avgRating > 0 ? avgRating.toFixed(1) : "暫無評分"} ({reviews.length} 則評價)
            </span>
          </div>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}
        </section>

        {/* 常見目標魚種 */}
        <section>
          <h3 className="mb-4 text-lg font-bold">此釣點常見魚種</h3>
          {fishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">暫無此釣點的目標魚種資料。</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fishes.map((fish) => (
                <Link
                  key={fish.id}
                  href={`/species/${fish.id}`}
                  className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-md"
                >
                  <p className="font-semibold">{fish.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">數量豐富度：{fish.abundance}</p>
                  <p className="text-xs text-muted-foreground">最佳作釣季節：{fish.best_season}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 撰寫評論表單 */}
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <h3 className="mb-4 text-lg font-bold">發表釣點評價</h3>
          {success && (
            <div className="mb-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              評價已成功送出！
            </div>
          )}
          <form onSubmit={handleReview} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">點擊星星評分</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                    className={`text-2xl transition-transform hover:scale-110 ${s <= reviewForm.rating ? "text-yellow-400" : "text-muted-foreground/30"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">心得評論</label>
              <textarea
                rows={3}
                placeholder="分享你在這個釣點的作釣經驗、咬況或注意事項..."
                className={inputClass}
                value={reviewForm.review_content}
                onChange={(e) => setReviewForm((f) => ({ ...f, review_content: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
            >
              {submitting ? "提交中..." : "送出評價"}
            </button>
          </form>
        </section>

        {/* 歷史評價列表 */}
        <section>
          <h3 className="mb-4 text-lg font-bold">釣友評價紀錄 ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前暫無評價。快來分享你的第一手釣況吧！</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={`text-sm ${s <= r.rating ? "text-yellow-400" : "text-muted-foreground/30"}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{r.review_content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
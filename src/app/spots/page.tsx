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

const defaultForm = {
  name: "",
  location: "",
  water_type: "海",
  description: "",
  lat: "",
  lng: "",
};

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function loadSpots() {
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

  useEffect(() => { loadSpots(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location) {
      setError("釣點名稱與地點為必填。");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from("fishing_spots").insert({
      name: form.name,
      location: form.location,
      water_type: form.water_type,
      description: form.description || null,
      coordinates: `(${form.lng || 0}, ${form.lat || 0})`,
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setForm(defaultForm);
      setShowForm(false);
      setTimeout(() => setSuccess(false), 3000);
      setLoading(true);
      loadSpots();
    }
  };

  const waterTypeColor: Record<string, string> = {
    "海": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "溪": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "池": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };

  const inputClass = "w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
  const labelClass = "block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">首頁</Link>
            <Link href="/leaderboard" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">排行榜</Link>
            <Link href="/analysis" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">數據分析</Link>
            <h1 className="text-xl font-bold">📍 釣點總覽</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">全台釣點總覽</h2>
            <p className="mt-1 text-sm text-muted-foreground">點擊釣點查看詳細資訊、評價與目標魚種。</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(null); }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium backdrop-blur-md hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {showForm ? "取消" : "+ 新增釣點"}
          </button>
        </div>

        {/* 成功訊息 */}
        {success && (
          <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            釣點新增成功！
          </div>
        )}

        {/* 新增釣點表單 */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="mb-6 text-lg font-bold">新增釣點</h3>
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>釣點名稱 *</label>
                  <input
                    type="text"
                    placeholder="例：野柳外礁"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>地點 *</label>
                  <input
                    type="text"
                    placeholder="例：新北市萬里區"
                    className={inputClass}
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>水域類型 *</label>
                  <select className={inputClass} value={form.water_type} onChange={(e) => set("water_type", e.target.value)}>
                    <option value="海">海釣</option>
                    <option value="溪">溪釣</option>
                    <option value="池">池釣</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>緯度</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="例：25.21"
                    className={inputClass}
                    value={form.lat}
                    onChange={(e) => set("lat", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>經度</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="例：121.73"
                    className={inputClass}
                    value={form.lng}
                    onChange={(e) => set("lng", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>簡介</label>
                <textarea
                  rows={3}
                  placeholder="描述這個釣點的特色..."
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
                >
                  {submitting ? "新增中..." : "新增釣點"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(null); setForm(defaultForm); }}
                  className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 釣點列表 */}
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
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

interface TagOption { id: string; tag_name: string; }
interface SpeciesOption { id: string; common_name: string; }

const defaultForm = {
  name: "",
  location: "",
  water_type: "海",
  description: "",
};

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 標籤相關
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 魚種相關
  const [allSpecies, setAllSpecies] = useState<SpeciesOption[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const toggleSpecies = (id: string) =>
    setSelectedSpecies((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

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

  useEffect(() => {
    loadSpots();
    supabase.from("tags").select("id, tag_name").then(({ data }) => setAllTags(data ?? []));
    supabase.from("fish_species").select("id, common_name").then(({ data }) => setAllSpecies(data ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location) {
      setError("釣點名稱與地點為必填。");
      return;
    }
    setSubmitting(true);
    setError(null);

    // 新增釣點
    const { data: newSpot, error: spotErr } = await supabase
      .from("fishing_spots")
      .insert({
        name: form.name,
        location: form.location,
        water_type: form.water_type,
        description: form.description || null,
        coordinates: "(0,0)",
      })
      .select("id")
      .single();

    if (spotErr || !newSpot) {
      setError(spotErr?.message ?? "新增失敗");
      setSubmitting(false);
      return;
    }

    const spotId = newSpot.id;

    // 新增標籤關聯
    if (selectedTags.length > 0) {
      await supabase.from("spot_tag_mapping").insert(
        selectedTags.map((tag_id) => ({ fishing_spot_id: spotId, tag_id }))
      );
    }

    // 新增魚種關聯
    if (selectedSpecies.length > 0) {
      await supabase.from("spot_fish_mapping").insert(
        selectedSpecies.map((fish_species_id) => ({ fishing_spot_id: spotId, fish_species_id }))
      );
    }

    setSubmitting(false);
    setSuccess(true);
    setForm(defaultForm);
    setSelectedTags([]);
    setSelectedSpecies([]);
    setShowForm(false);
    setTimeout(() => setSuccess(false), 3000);
    setLoading(true);
    loadSpots();
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

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            釣點新增成功！
          </div>
        )}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="mb-6 text-lg font-bold">新增釣點</h3>
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* 基本資訊 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>釣點名稱 *</label>
                  <input type="text" placeholder="例：野柳外礁" className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>地點 *</label>
                  <input type="text" placeholder="例：新北市萬里區" className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>水域類型 *</label>
                  <select className={inputClass} value={form.water_type} onChange={(e) => set("water_type", e.target.value)}>
                    <option value="海">海釣</option>
                    <option value="溪">溪釣</option>
                    <option value="池">池釣</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>簡介</label>
                <textarea rows={3} placeholder="描述這個釣點的特色..." className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>

              {/* 標籤選擇 */}
              <div>
                <label className={labelClass}>釣點標籤（可複選）</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      #{tag.tag_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 魚種選擇 */}
              <div>
                <label className={labelClass}>此釣點的目標魚種（可複選）</label>
                <div className="flex flex-wrap gap-2">
                  {allSpecies.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => toggleSpecies(sp.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selectedSpecies.includes(sp.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {sp.common_name}
                    </button>
                  ))}
                </div>
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
                  onClick={() => { setShowForm(false); setError(null); setForm(defaultForm); setSelectedTags([]); setSelectedSpecies([]); }}
                  className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

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
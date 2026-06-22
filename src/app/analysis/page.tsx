"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#6366f1",
];

interface SpotData    { id: string; name: string; count: number; }
interface SpeciesData { id: string; name: string; count: number; }
interface BaitData    { name: string; count: number; }
interface RankData    { rank: number; fish: string; spot: string; length_cm: number; weight_kg: number | null; }

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AnalysisPage() {
  const [spots, setSpots] = useState<SpotData[]>([]);
  const [hoverSpot, setHoverSpot] = useState<number>(-1);
  const [selectedSpot, setSelectedSpot] = useState<SpotData | null>(null);
  const [speciesList, setSpeciesList] = useState<SpeciesData[]>([]);
  const [hoverSpecies, setHoverSpecies] = useState<number>(-1);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesData | null>(null);
  const [spotBaits, setSpotBaits] = useState<BaitData[]>([]);
  const [fishBaits, setFishBaits] = useState<BaitData[]>([]);
  const [rankings, setRankings] = useState<RankData[]>([]);
  const [loadingL2, setLoadingL2] = useState(false);

  useEffect(() => {
    supabase.from("catch_logs").select("fishing_spot_id, fishing_spots(name)").then(({ data }) => {
      if (!data) return;
      const map: Record<string, { name: string; count: number }> = {};
      data.forEach((r: any) => {
        const id = r.fishing_spot_id;
        const name = r.fishing_spots?.name ?? "未知";
        if (!map[id]) map[id] = { name, count: 0 };
        map[id].count++;
      });
      setSpots(Object.entries(map).map(([id, v]) => ({ id, ...v })));
    });
  }, []);

  // 💡 已修正：點選釣點時，直接從 catch_logs 一併撈出實際使用的 baits(name)
  useEffect(() => {
    if (!selectedSpot) return;
    setLoadingL2(true);
    setSelectedSpecies(null);
    setFishBaits([]);

    // 單一請求同時搞定「魚種分布」與「該釣點的實際用餌分布」
    supabase.from("catch_logs")
      .select("fish_species_id, fish_species(common_name), baits(name)")
      .eq("fishing_spot_id", selectedSpot.id)
      .then(async ({ data: catchData }) => {
        const sm: Record<string, { name: string; count: number }> = {};
        const bm: Record<string, number> = {};

        (catchData ?? []).forEach((r: any) => {
          // 1. 統計魚種
          const spId = r.fish_species_id;
          const spName = r.fish_species?.common_name ?? "未知";
          if (!sm[spId]) sm[spId] = { name: spName, count: 0 };
          sm[spId].count++;

          // 2. 統計這筆漁獲實際用的是什麼餌
          const baitName = r.baits?.name ?? "未知/未記錄";
          bm[baitName] = (bm[baitName] ?? 0) + 1;
        });

        setSpeciesList(Object.entries(sm).map(([id, v]) => ({ id, ...v })));
        setSpotBaits(Object.entries(bm).map(([name, count]) => ({ name, count })));

        // 撈取該釣點排行榜
        const { data: rankData } = await supabase.from("catch_logs")
          .select("length_cm, weight_kg, fish_species(common_name), fishing_spots(name)")
          .eq("fishing_spot_id", selectedSpot.id)
          .order("length_cm", { ascending: false })
          .limit(5);

        setRankings((rankData ?? []).map((r: any, i: number) => ({
          rank: i + 1,
          fish: r.fish_species?.common_name ?? "未知",
          spot: r.fishing_spots?.name ?? "未知",
          length_cm: r.length_cm,
          weight_kg: r.weight_kg ?? null,
        })));
        setLoadingL2(false);
      });
  }, [selectedSpot]);

  // 💡 已修正：點選特定魚種時，同樣直接去 catch_logs 篩選「該釣點 + 該魚種」的實際用餌
  useEffect(() => {
    if (!selectedSpecies || !selectedSpot) return;

    supabase.from("catch_logs")
      .select("baits(name)")
      .eq("fishing_spot_id", selectedSpot.id)
      .eq("fish_species_id", selectedSpecies.id)
      .then(({ data }) => {
        const bm: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          const name = r.baits?.name ?? "未知/未記錄";
          bm[name] = (bm[name] ?? 0) + 1;
        });
        setFishBaits(Object.entries(bm).map(([name, count]) => ({ name, count })));
      });

    // 撈取該魚種在該釣點的排行榜
    supabase.from("catch_logs")
      .select("length_cm, weight_kg, fish_species(common_name), fishing_spots(name)")
      .eq("fish_species_id", selectedSpecies.id)
      .eq("fishing_spot_id", selectedSpot.id)
      .order("length_cm", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRankings((data ?? []).map((r: any, i: number) => ({
          rank: i + 1,
          fish: r.fish_species?.common_name ?? "未知",
          spot: r.fishing_spots?.name ?? "未知",
          length_cm: r.length_cm,
          weight_kg: r.weight_kg ?? null,
        })));
      });
  }, [selectedSpecies, selectedSpot]);

  const baitData = selectedSpecies ? fishBaits : spotBaits;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              首頁
            </Link>
            <Link href="/leaderboard" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              排行榜
            </Link>
            <h1 className="text-xl font-bold">📊 數據分析</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-16">

        {/* 第一層：釣點分布 */}
        <section>
          <h2 className="mb-2 text-2xl font-bold">各釣點漁獲分布</h2>
          <p className="mb-8 text-sm text-muted-foreground">點擊釣點方塊，探索該釣點的詳細資訊。</p>

          {spots.length === 0 ? (
            <p className="text-muted-foreground">目前尚無資料。</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={spots} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={130} labelLine={false} label={renderCustomLabel}>
                    {spots.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={hoverSpot === -1 || hoverSpot === i ? 1 : 0.5} stroke={hoverSpot === i ? "#fff" : "none"} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, name: any) => [`${v} 筆漁獲`, name]} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {spots.map((spot, i) => (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedSpot(spot)}
                    onMouseEnter={() => setHoverSpot(i)}
                    onMouseLeave={() => setHoverSpot(-1)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${selectedSpot?.id === spot.id ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card/60 hover:border-primary/50"}`}
                  >
                    <div className="mb-2 h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="font-semibold text-sm">{spot.name}</p>
                    <p className="text-xs text-muted-foreground">{spot.count} 筆漁獲</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* 第二層：詳細數據 */}
        {selectedSpot && (
          <section className="space-y-10">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{selectedSpot.name}</h2>
              <button
                onClick={() => { setSelectedSpot(null); setSelectedSpecies(null); }}
                className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
              >
                取消選取
              </button>
            </div>

            {loadingL2 ? (
              <p className="text-muted-foreground">載入中...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* 魚種分布 */}
                  <div className="rounded-2xl border border-border bg-card/60 p-6">
                    <h3 className="mb-4 font-semibold">魚種分布</h3>
                    {speciesList.length === 0 ? (
                      <p className="text-sm text-muted-foreground">尚無資料。</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={speciesList} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderCustomLabel}>
                            {speciesList.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={hoverSpecies === -1 || hoverSpecies === i ? 1 : 0.5} stroke={hoverSpecies === i ? "#fff" : "none"} strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any, name: any) => [`${v} 筆漁獲`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* 餌料分布（已修改為顯示實際起魚餌料） */}
                  <div className="rounded-2xl border border-border bg-card/60 p-6">
                    <h3 className="mb-1 font-semibold">餌料分布</h3>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {selectedSpecies ? `顯示魚種：${selectedSpecies.name} 的實際用餌` : `顯示釣點：${selectedSpot.name} 的實際用餌`}
                    </p>
                    {baitData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">尚無餌料資料。</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={baitData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderCustomLabel}>
                            {baitData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          {/* 提示字同步修改為「筆漁獲」，滑鼠移上去會顯示：[餌料名稱]: 1 筆漁獲 */}
                          <Tooltip formatter={(v: any, name: any) => [`${v} 筆漁獲`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 魚種選擇區塊 */}
                <div>
                  <h3 className="mb-3 font-semibold">魚種選擇</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {speciesList.map((sp, i) => (
                      <button
                        key={sp.id}
                        onClick={() => setSelectedSpecies(selectedSpecies?.id === sp.id ? null : sp)}
                        onMouseEnter={() => setHoverSpecies(i)}
                        onMouseLeave={() => setHoverSpecies(-1)}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${selectedSpecies?.id === sp.id ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card/60 hover:border-primary/50"}`}
                      >
                        <div className="mb-2 h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <p className="font-semibold text-sm">{sp.name}</p>
                        <p className="text-xs text-muted-foreground">{sp.count} 筆漁獲</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 排行榜區塊 */}
                <div>
                  <h3 className="mb-3 font-semibold">
                    {selectedSpecies ? `排行榜 · ${selectedSpecies.name}` : `排行榜 · ${selectedSpot.name}`}
                  </h3>
                  {rankings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">尚無紀錄。</p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">名次</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">魚種</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">釣點</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">體長</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">重量</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((r) => (
                            <tr key={r.rank} className="border-t border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-bold">
                                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                              </td>
                              <td className="px-4 py-3 font-medium">{r.fish}</td>
                              <td className="px-4 py-3 text-muted-foreground">{r.spot}</td>
                              <td className="px-4 py-3">{r.length_cm} cm</td>
                              <td className="px-4 py-3">{r.weight_kg ? `${r.weight_kg} kg` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
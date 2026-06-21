"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Option { id: string; name: string; }

export function CatchForm({ onSuccess }: { onSuccess?: () => void }) {
  const [spots, setSpots] = useState<Option[]>([]);
  const [species, setSpecies] = useState<Option[]>([]);
  const [baits, setBaits] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fishing_spot_id: "",
    fish_species_id: "",
    bait_id: "",
    length_cm: "",
    weight_kg: "",
    tide_status: "",
    wind_direction: "",
    water_temperature_celsius: "",
    fishing_period: "",
    notes: "",
  });

  useEffect(() => {
    supabase.from("fishing_spots").select("id, name").then(({ data }) => {
      if (data) setSpots(data);
    });
    supabase.from("fish_species").select("id, common_name").then(({ data }) => {
      if (data) setSpecies(data.map((s) => ({ id: s.id, name: s.common_name })));
    });
    supabase.from("baits").select("id, name").then(({ data }) => {
      if (data) setBaits(data);
    });
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fishing_spot_id || !form.fish_species_id || !form.length_cm) {
      setError("請填寫必要欄位：釣點、魚種及魚體長度。");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from("catch_logs").insert({
      fishing_spot_id: form.fishing_spot_id,
      fish_species_id: form.fish_species_id,
      bait_id: form.bait_id || null,
      length_cm: Number(form.length_cm),
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      tide_status: form.tide_status || null,
      wind_direction: form.wind_direction || null,
      water_temperature_celsius: form.water_temperature_celsius ? Number(form.water_temperature_celsius) : null,
      fishing_period: form.fishing_period || null,
      notes: form.notes || null,
      user_id: "00000000-0000-0000-0000-000000000000",
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setForm({
        fishing_spot_id: "", fish_species_id: "", bait_id: "",
        length_cm: "", weight_kg: "", tide_status: "", wind_direction: "",
        water_temperature_celsius: "", fishing_period: "", notes: "",
      });
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const inputClass = "w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const labelClass = "block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {success && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          釣果已成功紀錄！快去戰績排行榜看看吧 🎣
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 選擇釣點 */}
        <div>
          <label className={labelClass}>作釣釣點 *</label>
          <select className={inputClass} value={form.fishing_spot_id} onChange={(e) => set("fishing_spot_id", e.target.value)}>
            <option value="">請選擇釣點...</option>
            {spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* 選擇魚種 */}
        <div>
          <label className={labelClass}>目標魚種 *</label>
          <select className={inputClass} value={form.fish_species_id} onChange={(e) => set("fish_species_id", e.target.value)}>
            <option value="">請選擇魚種...</option>
            {species.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* 選擇餌料 */}
        <div>
          <label className={labelClass}>使用餌料</label>
          <select className={inputClass} value={form.bait_id} onChange={(e) => set("bait_id", e.target.value)}>
            <option value="">請選擇餌料...</option>
            {baits.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* 魚體長度 */}
        <div>
          <label className={labelClass}>長度 (cm) *</label>
          <input type="number" min="0" step="0.1" placeholder="例如：45" className={inputClass} value={form.length_cm} onChange={(e) => set("length_cm", e.target.value)} />
        </div>

        {/* 魚體重量 */}
        <div>
          <label className={labelClass}>重量 (kg)</label>
          <input type="number" min="0" step="0.01" placeholder="例如：1.2" className={inputClass} value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
        </div>

        {/* 潮汐狀態 */}
        <div>
          <label className={labelClass}>潮汐狀態</label>
          <select className={inputClass} value={form.tide_status} onChange={(e) => set("tide_status", e.target.value)}>
            <option value="">請選擇潮汐...</option>
            <option value="High Tide">滿潮</option>
            <option value="Low Tide">乾潮</option>
            <option value="Spring Tide">大潮</option>
            <option value="Neap Tide">小潮</option>
          </select>
        </div>

        {/* 作釣時段 */}
        <div>
          <label className={labelClass}>作釣時段</label>
          <select className={inputClass} value={form.fishing_period} onChange={(e) => set("fishing_period", e.target.value)}>
            <option value="">請選擇時段...</option>
            <option value="Dawn">清晨 (晨光)</option>
            <option value="Morning">上午</option>
            <option value="Afternoon">下午</option>
            <option value="Evening">傍晚/夜釣</option>
            <option value="Midnight">深夜/坎頂</option>
          </select>
        </div>

        {/* 當下風向 */}
        <div>
          <label className={labelClass}>風向</label>
          <select className={inputClass} value={form.wind_direction} onChange={(e) => set("wind_direction", e.target.value)}>
            <option value="">請選擇風向...</option>
            <option value="N">北風 (N)</option>
            <option value="S">南風 (S)</option>
            <option value="E">東風 (E)</option>
            <option value="W">西風 (W)</option>
            <option value="NE">東北風 (NE)</option>
            <option value="NW">西北風 (NW)</option>
            <option value="SE">東南風 (SE)</option>
            <option value="SW">西南風 (SW)</option>
          </select>
        </div>

        {/* 當下水溫 */}
        <div>
          <label className={labelClass}>當下水溫 (°C)</label>
          <input type="number" min="0" max="40" step="0.1" placeholder="例如：24" className={inputClass} value={form.water_temperature_celsius} onChange={(e) => set("water_temperature_celsius", e.target.value)} />
        </div>
      </div>

      {/* 備註與心得 */}
      <div>
        <label className={labelClass}>備註 / 釣況心得</label>
        <textarea rows={3} placeholder="分享一下當天的流水、咬況、起魚心得或是特殊釣組技巧..." className={inputClass} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "資料提交中..." : "登錄釣果戰績"}
      </button>
    </form>
  );
}
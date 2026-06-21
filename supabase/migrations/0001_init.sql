-- 釣客天堂：釣魚情報與社群平台
-- 完整 schema：核心圖鑑 + 戰績打卡 + 潮汐環境 + 釣點評價 + 裝備搭配

-- ============================================================================
-- 清理舊表（ClassWall 相關）
-- ============================================================================

drop table if exists public.question_likes cascade;
drop table if exists public.answers cascade;
drop table if exists public.questions cascade;
drop function if exists public.increment_question_like(uuid, text);

-- ============================================================================
-- 1. 核心圖鑑主表
-- ============================================================================

-- 釣點資訊表
create table if not exists public.fishing_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text not null,
  coordinates point not null,
  water_type text not null check (water_type in ('海', '溪', '池')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fishing_spots_water_type_idx on public.fishing_spots (water_type);
create index if not exists fishing_spots_name_idx on public.fishing_spots (name);

-- 魚種圖鑑表
create table if not exists public.fish_species (
  id uuid primary key default gen_random_uuid(),
  common_name text not null unique,
  scientific_name text,
  season text,
  size_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fish_species_common_name_idx on public.fish_species (common_name);

-- 餌料表
create table if not exists public.baits (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  bait_type text not null check (bait_type in ('假餌', '活餌', '粉餌')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists baits_bait_type_idx on public.baits (bait_type);

-- 釣組/仕掛表
create table if not exists public.rigs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  binding_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. 社群與核心功能表
-- ============================================================================

-- 漁獲戰績日誌
create table if not exists public.catch_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  fishing_spot_id uuid not null references public.fishing_spots (id) on delete cascade,
  fish_species_id uuid not null references public.fish_species (id) on delete cascade,
  bait_id uuid references public.baits (id) on delete set null,
  length_cm numeric(5, 2),
  weight_kg numeric(5, 2),
  photo_url text,
  notes text,
  tide_status text,
  wind_direction text,
  water_temperature_celsius numeric(4, 1),
  fishing_period text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catch_logs_user_id_idx on public.catch_logs (user_id);
create index if not exists catch_logs_fishing_spot_id_idx on public.catch_logs (fishing_spot_id);
create index if not exists catch_logs_fish_species_id_idx on public.catch_logs (fish_species_id);
create index if not exists catch_logs_created_at_idx on public.catch_logs (created_at desc);

-- 釣點評價表
create table if not exists public.spot_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  fishing_spot_id uuid not null references public.fishing_spots (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_content text not null check (char_length(review_content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spot_reviews_fishing_spot_id_idx on public.spot_reviews (fishing_spot_id);
create index if not exists spot_reviews_user_id_idx on public.spot_reviews (user_id);
create index if not exists spot_reviews_rating_idx on public.spot_reviews (rating);

-- 功能標籤庫
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  tag_name text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists tags_tag_name_idx on public.tags (tag_name);

-- ============================================================================
-- 3. 多對多中介表 (Junction Tables)
-- ============================================================================

-- 哪些釣點有什麼魚
create table if not exists public.spot_fish_mapping (
  id uuid primary key default gen_random_uuid(),
  fishing_spot_id uuid not null references public.fishing_spots (id) on delete cascade,
  fish_species_id uuid not null references public.fish_species (id) on delete cascade,
  abundance text,
  best_season text,
  created_at timestamptz not null default now(),
  unique (fishing_spot_id, fish_species_id)
);

create index if not exists spot_fish_mapping_fishing_spot_id_idx on public.spot_fish_mapping (fishing_spot_id);
create index if not exists spot_fish_mapping_fish_species_id_idx on public.spot_fish_mapping (fish_species_id);

-- 什麼魚吃什麼餌
create table if not exists public.fish_bait_mapping (
  id uuid primary key default gen_random_uuid(),
  fish_species_id uuid not null references public.fish_species (id) on delete cascade,
  bait_id uuid not null references public.baits (id) on delete cascade,
  effectiveness text,
  created_at timestamptz not null default now(),
  unique (fish_species_id, bait_id)
);

create index if not exists fish_bait_mapping_fish_species_id_idx on public.fish_bait_mapping (fish_species_id);
create index if not exists fish_bait_mapping_bait_id_idx on public.fish_bait_mapping (bait_id);

-- 什麼魚適合什麼釣組
create table if not exists public.fish_rig_mapping (
  id uuid primary key default gen_random_uuid(),
  fish_species_id uuid not null references public.fish_species (id) on delete cascade,
  rig_id uuid not null references public.rigs (id) on delete cascade,
  suitability text,
  created_at timestamptz not null default now(),
  unique (fish_species_id, rig_id)
);

create index if not exists fish_rig_mapping_fish_species_id_idx on public.fish_rig_mapping (fish_species_id);
create index if not exists fish_rig_mapping_rig_id_idx on public.fish_rig_mapping (rig_id);

-- 釣點與標籤的綁定
create table if not exists public.spot_tag_mapping (
  id uuid primary key default gen_random_uuid(),
  fishing_spot_id uuid not null references public.fishing_spots (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (fishing_spot_id, tag_id)
);

create index if not exists spot_tag_mapping_fishing_spot_id_idx on public.spot_tag_mapping (fishing_spot_id);
create index if not exists spot_tag_mapping_tag_id_idx on public.spot_tag_mapping (tag_id);

-- ============================================================================
-- 4. Realtime Publication
-- ============================================================================

do $$
begin
  -- 主表
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'fishing_spots'
  ) then
    execute 'alter publication supabase_realtime add table public.fishing_spots';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'catch_logs'
  ) then
    execute 'alter publication supabase_realtime add table public.catch_logs';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'spot_reviews'
  ) then
    execute 'alter publication supabase_realtime add table public.spot_reviews';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'fish_species'
  ) then
    execute 'alter publication supabase_realtime add table public.fish_species';
  end if;
end $$;

-- ============================================================================
-- 5. Row Level Security
-- ============================================================================

-- 啟用 RLS
alter table public.fishing_spots enable row level security;
alter table public.fish_species enable row level security;
alter table public.baits enable row level security;
alter table public.rigs enable row level security;
alter table public.catch_logs enable row level security;
alter table public.spot_reviews enable row level security;
alter table public.tags enable row level security;
alter table public.spot_fish_mapping enable row level security;
alter table public.fish_bait_mapping enable row level security;
alter table public.fish_rig_mapping enable row level security;
alter table public.spot_tag_mapping enable row level security;

-- Fishing Spots 政策
drop policy if exists "anyone can read fishing_spots" on public.fishing_spots;
create policy "anyone can read fishing_spots"
  on public.fishing_spots for select
  using (true);

drop policy if exists "anyone can insert fishing_spots" on public.fishing_spots;
create policy "anyone can insert fishing_spots"
  on public.fishing_spots for insert
  with check (true);

-- Fish Species 政策（圖鑑為參考資料，anon 可讀）
drop policy if exists "anyone can read fish_species" on public.fish_species;
create policy "anyone can read fish_species"
  on public.fish_species for select
  using (true);

-- Baits 政策
drop policy if exists "anyone can read baits" on public.baits;
create policy "anyone can read baits"
  on public.baits for select
  using (true);

-- Rigs 政策
drop policy if exists "anyone can read rigs" on public.rigs;
create policy "anyone can read rigs"
  on public.rigs for select
  using (true);

-- Catch Logs 政策
drop policy if exists "anyone can read catch_logs" on public.catch_logs;
create policy "anyone can read catch_logs"
  on public.catch_logs for select
  using (true);

drop policy if exists "anyone can insert catch_logs" on public.catch_logs;
create policy "anyone can insert catch_logs"
  on public.catch_logs for insert
  with check (true);

-- Spot Reviews 政策
drop policy if exists "anyone can read spot_reviews" on public.spot_reviews;
create policy "anyone can read spot_reviews"
  on public.spot_reviews for select
  using (true);

drop policy if exists "anyone can insert spot_reviews" on public.spot_reviews;
create policy "anyone can insert spot_reviews"
  on public.spot_reviews for insert
  with check (true);

-- Tags 政策
drop policy if exists "anyone can read tags" on public.tags;
create policy "anyone can read tags"
  on public.tags for select
  using (true);

-- 多對多映射表政策
drop policy if exists "anyone can read spot_fish_mapping" on public.spot_fish_mapping;
create policy "anyone can read spot_fish_mapping"
  on public.spot_fish_mapping for select
  using (true);

drop policy if exists "anyone can read fish_bait_mapping" on public.fish_bait_mapping;
create policy "anyone can read fish_bait_mapping"
  on public.fish_bait_mapping for select
  using (true);

drop policy if exists "anyone can read fish_rig_mapping" on public.fish_rig_mapping;
create policy "anyone can read fish_rig_mapping"
  on public.fish_rig_mapping for select
  using (true);

drop policy if exists "anyone can read spot_tag_mapping" on public.spot_tag_mapping;
create policy "anyone can read spot_tag_mapping"
  on public.spot_tag_mapping for select
  using (true);

-- ============================================================================
-- 6. Seed Data
-- ============================================================================

-- 1. 釣點 (8 筆 - 台灣著名釣點)
insert into public.fishing_spots (name, location, coordinates, water_type, description)
values
  ('野柳外礁', '新北市萬里區', point(121.73, 25.21), '海', '北海岸著名磯釣勝地，礁岩眾多，大魚頻出'),
  ('北堤漁港', '新北市瑞芳區', point(121.88, 25.11), '海', '九份附近防波堤，適合新手海釣，假日人多'),
  ('烏來溪流', '新北市烏來區', point(121.56, 24.86), '溪', '清溪釣點，苦花與石斑主要漁獲，涼爽舒適'),
  ('日月潭', '南投縣魚池鄉', point(120.87, 23.86), '池', '台灣最大淡水湖，四季皆宜，大型鯉魚常見'),
  ('東港蚵棚', '屏東縣東港鎮', point(120.45, 22.47), '海', '南部最熱門釣點，白毛港周邊蚵棚區域機關槍漁法'),
  ('鬼湖', '屏東縣霧台鄉', point(120.68, 22.67), '池', '高山湖泊，鯰魚與鯽魚豐富，風景優美'),
  ('新竹香山濱海', '新竹市香山區', point(120.90, 24.80), '海', '西部沿海，適合軟蟲釣，近年黑鱸復育成功'),
  ('宜蘭烏石港', '宜蘭縣頭城鎮', point(121.83, 24.87), '海', '東北角釣點，金目鱸與黑鯛活躍，漁港夜釣熱門')
on conflict (name) do nothing;

-- 2. 魚種 (8 筆 - 台灣常見釣魚對象)
insert into public.fish_species (common_name, scientific_name, season, size_description)
values
  ('黑鯛', 'Acanthopagrus schlegelii', '秋冬', '大型魚，15-40cm，南北海域均有'),
  ('金目鱸', 'Johnius dussumieri', '春夏', '中型魚，20-35cm，海水，較溫暖時活躍'),
  ('黑鱸', 'Lateolabrax japonicus', '全年', '大型肉食魚，25-50cm，河口及沿海'),
  ('苦花', 'Varicorhinus alticorpus', '全年', '中型淡水魚，15-25cm，溪流常見'),
  ('石斑', 'Epinephelus akaara', '夏秋', '大型魚，20-45cm，礁岩區'),
  ('鯉魚', 'Cyprinus carpio', '春夏', '大型魚，30-60cm，淡水湖泊'),
  ('白毛港', 'Leiognathus equulus', '全年', '小型魚，8-12cm，機關槍釣最愛'),
  ('白帶魚', 'Trichiurus lepturus', '春冬', '細長魚，40-80cm，夜間活躍')
on conflict (common_name) do nothing;

-- 3. 餌料 (8 筆 - 台灣常見釣餌)
insert into public.baits (name, bait_type, description)
values
  ('青蟲', '活餌', '溪釣主力餌料，苦花最愛，鮮度要求高'),
  ('秋刀魚', '活餌', '海釣最常用，黑鯛鯊魚慾望強，一尾多用'),
  ('米諾假餌', '假餌', '軟蟲系列，黑鱸及其他肉食魚最愛'),
  ('軟蟲', '假餌', '德州釣組必備，擬真度高，釣黑鱸一絕'),
  ('練餌', '粉餌', '傳統粉狀餌料，鯉魚及鯽魚專用'),
  ('玉米粒', '粉餌', '便宜好用，白毛港及小型魚集中釣'),
  ('蝦仁', '活餌', '萬能餌料，各種魚都吃，南部蚵棚區熱門'),
  ('蚯蚓', '活餌', '溪釣及淡水標配，石斑在溪流也吃')
on conflict (name) do nothing;

-- 4. 釣組 (8 筆 - 常用釣組)
insert into public.rigs (name, binding_description)
values
  ('德州釣組', '倒吊型設計，軟蟲搭配，黑鱸專用裝備'),
  ('倒吊釣組', '鉛頭?下沉，礁岩及深水必備'),
  ('阿波浮標', '日本傳統浮標釣組，遠投性好，防波堤主力'),
  ('沉底釣組', '天秤加重鉛，適合海底釣'),
  ('三本?天秤組', '經典日式釣組，機械魚及混合釣最愛'),
  ('磯釣釣組', '複雜仕掛，礁岩專用，需經驗'),
  ('浮漂釣組', '溪釣全能型，淺水及中層皆可'),
  ('鉛筆釣', '擬餌釣法，表層釣，夜間或晨昏最佳')
on conflict (name) do nothing;

-- 5. 標籤 (10 筆)
insert into public.tags (tag_name)
values
  ('需防滑鞋'),
  ('蚊子多'),
  ('有廁所'),
  ('停車方便'),
  ('夜釣佳地'),
  ('初心者友善'),
  ('海釣勝地'),
  ('溪釣推薦'),
  ('機關槍釣'),
  ('磯釣聖地')
on conflict (tag_name) do nothing;

-- ============================================================================
-- 6. 多對多映射
-- ============================================================================

-- 釣點-魚種映射
insert into public.spot_fish_mapping (fishing_spot_id, fish_species_id, abundance, best_season)
select fs.id, fsp.id, m.abundance, m.best_season
from (
  values
    ('野柳外礁', '黑鯛', '常見', '秋冬'),
    ('野柳外礁', '石斑', '常見', '夏秋'),
    ('野柳外礁', '白帶魚', '偶見', '春冬'),
    ('北堤漁港', '黑鯛', '常見', '全年'),
    ('北堤漁港', '金目鱸', '偶見', '春夏'),
    ('烏來溪流', '苦花', '常見', '全年'),
    ('烏來溪流', '石斑', '偶見', '夏秋'),
    ('烏來溪流', '黑鱸', '偶見', '春夏'),
    ('日月潭', '鯉魚', '常見', '春夏'),
    ('日月潭', '鯽魚', '常見', '全年'),
    ('東港蚵棚', '白毛港', '常見', '全年'),
    ('東港蚵棚', '黑鯛', '常見', '秋冬'),
    ('鬼湖', '鯰魚', '常見', '全年'),
    ('新竹香山濱海', '黑鱸', '常見', '春夏'),
    ('新竹香山濱海', '黑鯛', '偶見', '秋冬'),
    ('宜蘭烏石港', '金目鱸', '常見', '全年'),
    ('宜蘭烏石港', '黑鯛', '常見', '秋冬')
) as m(spot_name, fish_name, abundance, best_season)
join public.fishing_spots fs on fs.name = m.spot_name
join public.fish_species fsp on fsp.common_name = m.fish_name
on conflict (fishing_spot_id, fish_species_id) do nothing;

-- 魚種-餌料映射
insert into public.fish_bait_mapping (fish_species_id, bait_id, effectiveness)
select fsp.id, b.id, m.effectiveness
from (
  values
    ('黑鯛', '秋刀魚', '很有效'),
    ('黑鯛', '蝦仁', '很有效'),
    ('黑鯛', '練餌', '有效'),
    ('金目鱸', '秋刀魚', '很有效'),
    ('金目鱸', '蝦仁', '有效'),
    ('黑鱸', '米諾假餌', '很有效'),
    ('黑鱸', '軟蟲', '很有效'),
    ('黑鱸', '秋刀魚', '有效'),
    ('苦花', '青蟲', '很有效'),
    ('苦花', '蚯蚓', '很有效'),
    ('石斑', '蝦仁', '很有效'),
    ('石斑', '秋刀魚', '很有效'),
    ('石斑', '蚯蚓', '有效'),
    ('鯉魚', '練餌', '很有效'),
    ('鯉魚', '玉米粒', '有效'),
    ('白毛港', '玉米粒', '很有效'),
    ('白毛港', '蝦仁', '很有效'),
    ('白帶魚', '秋刀魚', '很有效')
) as m(fish_name, bait_name, effectiveness)
join public.fish_species fsp on fsp.common_name = m.fish_name
join public.baits b on b.name = m.bait_name
on conflict (fish_species_id, bait_id) do nothing;

-- 魚種-釣組映射
insert into public.fish_rig_mapping (fish_species_id, rig_id, suitability)
select fsp.id, r.id, m.suitability
from (
  values
    ('黑鯛', '阿波浮標', '最適合'),
    ('黑鯛', '磯釣釣組', '最適合'),
    ('金目鱸', '阿波浮標', '適合'),
    ('黑鱸', '德州釣組', '最適合'),
    ('黑鱸', '鉛筆釣', '最適合'),
    ('苦花', '浮漂釣組', '最適合'),
    ('苦花', '沉底釣組', '適合'),
    ('石斑', '磯釣釣組', '最適合'),
    ('石斑', '倒吊釣組', '最適合'),
    ('鯉魚', '三本?天秤組', '最適合'),
    ('鯉魚', '沉底釣組', '適合'),
    ('白毛港', '三本?天秤組', '最適合'),
    ('白帶魚', '鉛筆釣', '最適合')
) as m(fish_name, rig_name, suitability)
join public.fish_species fsp on fsp.common_name = m.fish_name
join public.rigs r on r.name = m.rig_name
on conflict (fish_species_id, rig_id) do nothing;

-- 釣點-標籤映射
insert into public.spot_tag_mapping (fishing_spot_id, tag_id)
select fs.id, t.id
from (
  values
    ('野柳外礁', '需防滑鞋'),
    ('野柳外礁', '海釣勝地'),
    ('野柳外礁', '磯釣聖地'),
    ('北堤漁港', '初心者友善'),
    ('北堤漁港', '停車方便'),
    ('北堤漁港', '有廁所'),
    ('烏來溪流', '溪釣推薦'),
    ('烏來溪流', '蚊子多'),
    ('烏來溪流', '初心者友善'),
    ('日月潭', '停車方便'),
    ('日月潭', '有廁所'),
    ('日月潭', '夜釣佳地'),
    ('東港蚵棚', '海釣勝地'),
    ('東港蚵棚', '機關槍釣'),
    ('鬼湖', '溪釣推薦'),
    ('新竹香山濱海', '海釣勝地'),
    ('新竹香山濱海', '停車方便'),
    ('宜蘭烏石港', '夜釣佳地'),
    ('宜蘭烏石港', '海釣勝地')
) as m(spot_name, tag_name)
join public.fishing_spots fs on fs.name = m.spot_name
join public.tags t on t.tag_name = m.tag_name
on conflict (fishing_spot_id, tag_id) do nothing;

-- ============================================================================
-- 7. 漁獲紀錄 (3 筆)
-- ============================================================================

insert into public.catch_logs (
  user_id, fishing_spot_id, fish_species_id, bait_id, 
  length_cm, weight_kg, photo_url, notes,
  tide_status, wind_direction, water_temperature_celsius, fishing_period,
  created_at
)
select
  m.user_id, fs.id, fsp.id, b.id,
  m.length_cm, m.weight_kg, m.photo_url, m.notes,
  m.tide_status, m.wind_direction, m.water_temperature_celsius, m.fishing_period,
  m.created_at
from (
  values
    (
      'anon_user_001',
      '野柳外礁',
      '黑鯛',
      '秋刀魚',
      32.5,
      1.8,
      'https://example.com/catch/blackSeaBream_001.jpg',
      '今天黑潮旺盛，黑鯛咬餌相當兇悍，用阿波釣組遠投效果最好',
      '淨水',
      '東北',
      22.5,
      '早晨',
      now() - interval '3 days'
    ),
    (
      'anon_user_002',
      '烏來溪流',
      '苦花',
      '青蟲',
      18.0,
      0.35,
      'https://example.com/catch/iwana_001.jpg',
      '溪水清澈，苦花群集在深潭區，用青蟲大豐收，共釣獲 12 尾',
      '流水',
      '北',
      18.0,
      '傍晚',
      now() - interval '5 days'
    ),
    (
      'anon_user_003',
      '東港蚵棚',
      '白毛港',
      '玉米粒',
      10.2,
      0.08,
      'https://example.com/catch/whitebait_001.jpg',
      '機關槍釣大爆發，白毛港密集度超高，用三本?天秤組狂釣，今天夠本',
      '高潮',
      '西',
      25.0,
      '中午',
      now() - interval '1 day'
    )
) as m(
  user_id, spot_name, fish_name, bait_name, 
  length_cm, weight_kg, photo_url, notes,
  tide_status, wind_direction, water_temperature_celsius, fishing_period,
  created_at
)
join public.fishing_spots fs on fs.name = m.spot_name
join public.fish_species fsp on fsp.common_name = m.fish_name
join public.baits b on b.name = m.bait_name
on conflict do nothing;

-- ============================================================================
-- 8. 釣點評價 (3 筆)
-- ============================================================================

insert into public.spot_reviews (
  user_id, fishing_spot_id, rating, review_content, created_at
)
select
  m.user_id, fs.id, m.rating, m.review_content, m.created_at
from (
  values
    (
      'anon_user_004',
      '野柳外礁',
      5,
      '野柳外礁真的是北海岸釣點天堂！環境優美，魚況穩定，黑鯛季節超肥，就是要小心防滑鞋一定要帶。推薦所有會磯釣的朋友來朝聖！',
      now() - interval '7 days'
    ),
    (
      'anon_user_005',
      '烏來溪流',
      4,
      '烏來溪是北台灣溪釣首選，苦花和石斑都不少，水質清澈宜人。缺點是蚊子真的多，要帶防蚊液。假日人滿為患，建議平日去。',
      now() - interval '10 days'
    ),
    (
      'anon_user_006',
      '東港蚵棚',
      5,
      '東港蚵棚的機關槍釣真的絕了！白毛港多到爆炸，即使是新手也能釣爽爽。漁港旁夜市美食多，釣完可以吃宵夜，CP 值超高！',
      now() - interval '4 days'
    )
) as m(user_id, spot_name, rating, review_content, created_at)
join public.fishing_spots fs on fs.name = m.spot_name
on conflict do nothing;

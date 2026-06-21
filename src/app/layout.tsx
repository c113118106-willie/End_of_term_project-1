import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 字體設定
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// 已修改：網頁名稱與描述中文化，移除所有亂碼
export const metadata: Metadata = {
  title: "全台釣友巨物俱樂部",
  description: "全台熱門釣點導覽、釣果戰績紀錄與數據分析系統",
};

// 避免深色模式閃爍（FOUC）：由 localStorage 或系統偏好決定是否加上 .dark class
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem("fishing:theme");
    var sys = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = t === "dark" || (!t && sys);
    if (dark) document.documentElement.classList.add("dark");
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
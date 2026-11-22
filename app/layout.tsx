import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "港樓計數機 Pro · PropCalc HK — 香港置業決策儀表板",
    template: "%s · PropCalc HK",
  },
  description:
    "香港買樓計數機：從價印花稅（2025 新稅階）、按保成數與保費、H 按／P 按月供、入息要求、30 年租買淨資產對比、收租回報，全部即時計算，免廣告免登記。Hong Kong property calculator with stamp duty, mortgage insurance, affordability and buy-vs-rent analysis.",
  applicationName: "PropCalc HK",
  keywords: [
    "香港買樓",
    "置業計算機",
    "按揭計算",
    "印花稅",
    "從價印花稅",
    "按保",
    "按揭保險",
    "租買對比",
    "收租回報",
    "H按",
    "P按",
    "Hong Kong mortgage calculator",
    "stamp duty Hong Kong",
    "buy vs rent Hong Kong",
  ],
  authors: [{ name: "PropCalc HK" }],
  openGraph: {
    title: "港樓計數機 Pro · PropCalc HK",
    description:
      "印花稅、按保、月供、入息、30 年租買對比，一頁即時計清。A Hong Kong property decision dashboard.",
    type: "website",
    locale: "zh_HK",
    siteName: "PropCalc HK",
  },
  twitter: {
    card: "summary_large_image",
    title: "港樓計數機 Pro · PropCalc HK",
    description: "香港置業決策儀表板：印花稅、按保、月供、租買對比、收租回報。",
  },
  robots: { index: true, follow: true },
  category: "finance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060609" },
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('propcalc-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

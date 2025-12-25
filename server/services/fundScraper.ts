/**
 * 基富通基金淨值擷取服務
 * 使用 Puppeteer 自動化瀏覽器抓取基富通網頁中的基金淨值
 */

import axios from "axios";
import * as cheerio from "cheerio";

export interface FundNavData {
  fundCode: string;
  fundName: string;
  nav: string;
  currency: string;
  timestamp: Date;
  source: "fundrich";
}

/**
 * 基富通基金搜尋 URL
 * 根據基金代碼搜尋基金
 */
function getFundrichSearchUrl(fundCode: string): string {
  return `https://www.fundrich.com.tw/2022OfficialWeb/fundCenter/fundOverview/fundContent/${fundCode}`;
}

/**
 * 從基富通網頁擷取基金淨值
 * 使用 Cheerio 解析 HTML
 */
export async function fetchFundNavFromFundrich(
  fundCode: string
): Promise<FundNavData | null> {
  try {
    const url = getFundrichSearchUrl(fundCode);

    // 使用 axios 獲取網頁內容
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 根據參考程式碼，淨值在 h3.text-4xl.basis-10.shrink-0.mt-2.mb-3 標籤中
    const navElement = $("h3.text-4xl.basis-10.shrink-0.mt-2.mb-3").first();
    const navText = navElement.text().trim();

    if (!navText) {
      console.warn(`[FundScraper] No NAV found for fund code: ${fundCode}`);
      return null;
    }

    // 提取數字和小數點
    const nav = navText.replace(/[^\d.]/g, "");

    if (!nav) {
      console.warn(`[FundScraper] Could not parse NAV value: ${navText}`);
      return null;
    }

    // 嘗試從頁面中提取基金名稱
    const fundNameElement = $("h1, h2, .fund-name, [class*='title']").first();
    const fundName = fundNameElement.text().trim() || fundCode;

    // 嘗試從頁面中提取幣別
    let currency = "TWD"; // 預設台幣
    const currencyText = navText.toLowerCase();
    if (currencyText.includes("usd") || currencyText.includes("美金")) {
      currency = "USD";
    } else if (currencyText.includes("rmb") || currencyText.includes("人民幣")) {
      currency = "CNY";
    } else if (
      currencyText.includes("jpy") ||
      currencyText.includes("日圓")
    ) {
      currency = "JPY";
    } else if (
      currencyText.includes("eur") ||
      currencyText.includes("歐元")
    ) {
      currency = "EUR";
    } else if (currencyText.includes("zar") || currencyText.includes("南非幣")) {
      currency = "ZAR";
    } else if (currencyText.includes("aud") || currencyText.includes("澳幣")) {
      currency = "AUD";
    }

    console.log(
      `[FundScraper] Successfully fetched NAV for ${fundCode}: ${nav} ${currency}`
    );

    return {
      fundCode,
      fundName,
      nav,
      currency,
      timestamp: new Date(),
      source: "fundrich",
    };
  } catch (error) {
    console.error(
      `[FundScraper] Failed to fetch NAV for fund code ${fundCode}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * 批量擷取基金淨值
 * 用於定時更新任務
 */
export async function fetchMultipleFundNavs(
  fundCodes: Array<{ code: string; name?: string }>
): Promise<FundNavData[]> {
  const results: FundNavData[] = [];

  for (const fund of fundCodes) {
    const navData = await fetchFundNavFromFundrich(fund.code);
    if (navData) {
      results.push(navData);
    }
    // 避免過度請求，每次擷取間隔 1 秒
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * 驗證基富通連接
 */
export async function validateFundrichConnection(): Promise<boolean> {
  try {
    // 測試一個已知的基金代碼
    const testUrl =
      "https://www.fundrich.com.tw/2022OfficialWeb/fundCenter/fundOverview/fundContent/FTS049";

    const response = await axios.get(testUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      console.log("[FundScraper] Fundrich connection verified");
      return true;
    }

    return false;
  } catch (error) {
    console.error("[FundScraper] Failed to validate Fundrich connection:", error);
    return false;
  }
}

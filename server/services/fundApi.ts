/**
 * 基金淨值 API 整合服務
 * 支援台灣基金、美股 ETF 等多種資料來源
 */

import axios from "axios";

// Alpha Vantage API 配置
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "";
const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

export interface FundNavData {
  symbol: string;
  name: string;
  nav: string;
  currency: string;
  timestamp: Date;
  source: "alpha-vantage" | "taiwan-fund" | "manual";
}

/**
 * 從 Alpha Vantage 獲取股票/ETF 最新報價
 * 支援美股、ETF 等
 */
export async function fetchFromAlphaVantage(
  symbol: string
): Promise<FundNavData | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn(
      "[FundApi] Alpha Vantage API key not configured, skipping..."
    );
    return null;
  }

  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
      timeout: 10000,
    });

    const data = response.data;

    // 檢查 API 錯誤
    if (data["Error Message"]) {
      console.error(`[FundApi] Alpha Vantage error: ${data["Error Message"]}`);
      return null;
    }

    if (data["Note"]) {
      console.warn(`[FundApi] Alpha Vantage rate limit: ${data["Note"]}`);
      return null;
    }

    const quote = data["Global Quote"];
    if (!quote || !quote["05. price"]) {
      console.warn(`[FundApi] No quote data for symbol: ${symbol}`);
      return null;
    }

    return {
      symbol: symbol,
      name: quote["01. symbol"] || symbol,
      nav: quote["05. price"],
      currency: "USD", // Alpha Vantage 預設為 USD
      timestamp: new Date(),
      source: "alpha-vantage",
    };
  } catch (error) {
    console.error(
      `[FundApi] Failed to fetch from Alpha Vantage for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * 從台灣基金資訊觀測站獲取基金淨值
 * 支援台灣本地基金
 */
export async function fetchTaiwanFundNav(
  fundCode: string
): Promise<FundNavData | null> {
  try {
    // 台灣基金資訊觀測站 API
    // 注意：實際 API 端點需要根據官方文檔調整
    const response = await axios.get(
      "https://www.fundrich.com.tw/api/fund/nav",
      {
        params: {
          code: fundCode,
        },
        timeout: 10000,
      }
    );

    const data = response.data;

    if (data.status !== 200 || !data.data) {
      console.warn(`[FundApi] No Taiwan fund data for code: ${fundCode}`);
      return null;
    }

    return {
      symbol: fundCode,
      name: data.data.name || fundCode,
      nav: data.data.nav,
      currency: "TWD",
      timestamp: new Date(data.data.date),
      source: "taiwan-fund",
    };
  } catch (error) {
    console.error(
      `[FundApi] Failed to fetch Taiwan fund NAV for ${fundCode}:`,
      error
    );
    return null;
  }
}

/**
 * 智能基金淨值查詢
 * 根據基金代碼格式自動選擇合適的 API
 */
export async function fetchFundNav(
  fundCode: string,
  fundName?: string
): Promise<FundNavData | null> {
  // 美股 ETF 或股票（通常為 1-5 個大寫字母）
  if (/^[A-Z]{1,5}$/.test(fundCode)) {
    const result = await fetchFromAlphaVantage(fundCode);
    if (result) return result;
  }

  // 台灣基金代碼（通常為 6 位數字）
  if (/^\d{6}$/.test(fundCode)) {
    const result = await fetchTaiwanFundNav(fundCode);
    if (result) return result;
  }

  // 如果代碼格式不符，嘗試用基金名稱搜尋
  if (fundName) {
    // 嘗試用基金名稱搜尋 Alpha Vantage
    const result = await fetchFromAlphaVantage(fundCode);
    if (result) return result;
  }

  console.warn(
    `[FundApi] Unable to determine fund type for code: ${fundCode}`
  );
  return null;
}

/**
 * 批量獲取基金淨值
 * 用於定時更新任務
 */
export async function fetchMultipleFundNavs(
  fundCodes: Array<{ code: string; name?: string }>
): Promise<FundNavData[]> {
  const results: FundNavData[] = [];

  for (const fund of fundCodes) {
    const navData = await fetchFundNav(fund.code, fund.name);
    if (navData) {
      results.push(navData);
    }
    // 避免觸發 API 速率限制
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * 驗證 API 連接
 */
export async function validateApiConnection(): Promise<boolean> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn("[FundApi] Alpha Vantage API key not configured");
    return false;
  }

  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: "AAPL",
        apikey: ALPHA_VANTAGE_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data["Global Quote"]) {
      console.log("[FundApi] Alpha Vantage API connection verified");
      return true;
    }

    if (response.data["Note"]) {
      console.warn("[FundApi] API rate limit reached");
      return true; // 連接正常，只是達到速率限制
    }

    return false;
  } catch (error) {
    console.error("[FundApi] Failed to validate API connection:", error);
    return false;
  }
}

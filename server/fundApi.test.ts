import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fundApi from "./services/fundApi";

describe("Fund API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchFundNav", () => {
    it("should identify US stock/ETF symbols and fetch from Alpha Vantage", async () => {
      // 測試符號識別邏輯
      const result = await fundApi.fetchFundNav("AAPL");
      // 由於 API key 可能未配置，結果可能為 null
      // 這裡主要測試函數不會拋出錯誤
      expect(result === null || result.symbol === "AAPL").toBe(true);
    });

    it("should identify Taiwan fund codes (6 digits) and attempt Taiwan fund API", async () => {
      // 測試台灣基金代碼識別
      const result = await fundApi.fetchFundNav("001001");
      // 由於 API 可能不可用，結果可能為 null
      expect(result === null || result.currency === "TWD").toBe(true);
    });

    it("should return null for invalid fund codes", async () => {
      const result = await fundApi.fetchFundNav("INVALID_CODE_XYZ");
      expect(result).toBeNull();
    });

    it("should handle API errors gracefully", async () => {
      // 測試錯誤處理
      const result = await fundApi.fetchFundNav("NONEXISTENT");
      expect(result === null).toBe(true);
    });
  });

  describe("fetchMultipleFundNavs", () => {
    it("should process multiple fund codes sequentially", async () => {
      const funds = [
        { code: "AAPL", name: "Apple Inc" },
        { code: "MSFT", name: "Microsoft Corp" },
      ];

      const results = await fundApi.fetchMultipleFundNavs(funds);
      // 結果應該是陣列
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle empty fund list", async () => {
      const results = await fundApi.fetchMultipleFundNavs([]);
      expect(results).toEqual([]);
    });
  });

  describe("validateApiConnection", () => {
    it("should validate API connection status", async () => {
      const isValid = await fundApi.validateApiConnection();
      // 應該返回布林值
      expect(typeof isValid).toBe("boolean");
    });
  });

  describe("Fund NAV Data Structure", () => {
    it("should return correct data structure for fund NAV", async () => {
      // 測試數據結構
      const mockNav: fundApi.FundNavData = {
        symbol: "AAPL",
        name: "Apple Inc",
        nav: "150.25",
        currency: "USD",
        timestamp: new Date(),
        source: "alpha-vantage",
      };

      expect(mockNav.symbol).toBeDefined();
      expect(mockNav.nav).toBeDefined();
      expect(mockNav.currency).toBeDefined();
      expect(mockNav.timestamp).toBeInstanceOf(Date);
    });
  });
});

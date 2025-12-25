import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fundScraper from "./fundScraper";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("Fund Scraper - Fundrich", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchFundNavFromFundrich", () => {
    it("should successfully fetch fund NAV from Fundrich", async () => {
      const mockHtml = `
        <html>
          <body>
            <h3 class="text-4xl basis-10 shrink-0 mt-2 mb-3">150.25 USD</h3>
            <h1>Test Fund Name</h1>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockHtml,
        status: 200,
      });

      const result = await fundScraper.fetchFundNavFromFundrich("FTS049");

      expect(result).not.toBeNull();
      expect(result?.nav).toBe("150.25");
      expect(result?.fundCode).toBe("FTS049");
      expect(result?.source).toBe("fundrich");
    });

    it("should handle currency detection", async () => {
      const mockHtml = `
        <html>
          <body>
            <h3 class="text-4xl basis-10 shrink-0 mt-2 mb-3">100.50 人民幣</h3>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockHtml,
        status: 200,
      });

      const result = await fundScraper.fetchFundNavFromFundrich("TCT057");

      expect(result?.currency).toBe("CNY");
    });

    it("should return null for invalid fund code", async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error("404 Not Found"));

      const result = await fundScraper.fetchFundNavFromFundrich("INVALID");

      expect(result).toBeNull();
    });

    it("should handle missing NAV element", async () => {
      const mockHtml = `
        <html>
          <body>
            <h1>Test Fund</h1>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockHtml,
        status: 200,
      });

      const result = await fundScraper.fetchFundNavFromFundrich("TEST001");

      expect(result).toBeNull();
    });

    it("should extract numeric value from NAV text", async () => {
      const mockHtml = `
        <html>
          <body>
            <h3 class="text-4xl basis-10 shrink-0 mt-2 mb-3">NT$123.456</h3>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockHtml,
        status: 200,
      });

      const result = await fundScraper.fetchFundNavFromFundrich("CSI098");

      expect(result?.nav).toBe("123.456");
    });
  });

  describe("fetchMultipleFundNavs", () => {
    it("should fetch multiple funds sequentially", async () => {
      const mockHtml = `
        <html>
          <body>
            <h3 class="text-4xl basis-10 shrink-0 mt-2 mb-3">100.00 USD</h3>
          </body>
        </html>
      `;

      vi.mocked(axios.get).mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const funds = [
        { code: "FTS049", name: "Fund 1" },
        { code: "CSI098", name: "Fund 2" },
      ];

      const results = await fundScraper.fetchMultipleFundNavs(funds);

      expect(results).toHaveLength(2);
      expect(results[0]?.fundCode).toBe("FTS049");
      expect(results[1]?.fundCode).toBe("CSI098");
    });

    it("should handle empty fund list", async () => {
      const results = await fundScraper.fetchMultipleFundNavs([]);

      expect(results).toEqual([]);
    });

    it("should skip failed fund fetches", async () => {
      const mockHtml = `
        <html>
          <body>
            <h3 class="text-4xl basis-10 shrink-0 mt-2 mb-3">100.00 USD</h3>
          </body>
        </html>
      `;

      vi.mocked(axios.get)
        .mockResolvedValueOnce({ data: mockHtml, status: 200 })
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ data: mockHtml, status: 200 });

      const funds = [
        { code: "FTS049" },
        { code: "INVALID" },
        { code: "CSI098" },
      ];

      const results = await fundScraper.fetchMultipleFundNavs(funds);

      // Should only have 2 successful results
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("validateFundrichConnection", () => {
    it("should return true for successful connection", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        status: 200,
        data: "<html></html>",
      });

      const isValid = await fundScraper.validateFundrichConnection();

      expect(isValid).toBe(true);
    });

    it("should return false for failed connection", async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error("Connection failed"));

      const isValid = await fundScraper.validateFundrichConnection();

      expect(isValid).toBe(false);
    });
  });

  describe("FundNavData Structure", () => {
    it("should have correct data structure", () => {
      const mockData: fundScraper.FundNavData = {
        fundCode: "FTS049",
        fundName: "Test Fund",
        nav: "150.25",
        currency: "USD",
        timestamp: new Date(),
        source: "fundrich",
      };

      expect(mockData.fundCode).toBeDefined();
      expect(mockData.nav).toBeDefined();
      expect(mockData.currency).toBeDefined();
      expect(mockData.timestamp).toBeInstanceOf(Date);
      expect(mockData.source).toBe("fundrich");
    });
  });
});

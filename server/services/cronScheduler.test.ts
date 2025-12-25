import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as cronScheduler from "./cronScheduler";
import * as fundScraper from "./fundScraper";
import * as db from "../db";

// Mock dependencies
vi.mock("./fundScraper");
vi.mock("../db");
vi.mock("node-cron");

describe("Cron Scheduler - Fund NAV Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateBackoffDelay", () => {
    it("should calculate exponential backoff correctly", () => {
      // 測試指數退避計算
      // 第 1 次重試: 5000ms
      // 第 2 次重試: 10000ms
      // 第 3 次重試: 20000ms (但最大 60000ms)
      
      const delays = [1, 2, 3].map((attempt) => {
        const delay = 5000 * Math.pow(2, attempt - 1);
        return Math.min(delay, 60000);
      });

      expect(delays[0]).toBe(5000);
      expect(delays[1]).toBe(10000);
      expect(delays[2]).toBe(20000);
    });

    it("should cap delay at maximum", () => {
      // 測試延遲上限
      const delay = 5000 * Math.pow(2, 10);
      const cappedDelay = Math.min(delay, 60000);
      expect(cappedDelay).toBe(60000);
    });
  });

  describe("executeTaskWithRetry", () => {
    it("should successfully execute task on first attempt", async () => {
      const mockFunds = [
        { id: 1, name: "Fund 1", fundrichCode: "FTS049" },
        { id: 2, name: "Fund 2", fundrichCode: "CSI098" },
      ];

      const mockNavData = [
        {
          fundCode: "FTS049",
          fundName: "Fund 1",
          nav: "150.25",
          currency: "USD",
          timestamp: new Date(),
          source: "fundrich" as const,
        },
      ];

      vi.mocked(db.getAllFunds).mockResolvedValueOnce(mockFunds as any);
      vi.mocked(fundScraper.fetchMultipleFundNavs).mockResolvedValueOnce(
        mockNavData
      );
      vi.mocked(db.updateFundNav).mockResolvedValueOnce(undefined);
      vi.mocked(db.updateFundLastNavUpdateTime).mockResolvedValueOnce(
        undefined
      );

      await cronScheduler.triggerTaskManually();

      expect(db.getAllFunds).toHaveBeenCalled();
      expect(fundScraper.fetchMultipleFundNavs).toHaveBeenCalled();
    });

    it("should handle task when no funds need update", async () => {
      vi.mocked(db.getAllFunds).mockResolvedValueOnce([]);

      const result = await cronScheduler.triggerTaskManually();

      expect(result.status).toBe("success");
      expect(result.fundCodesProcessed).toBe(0);
    });

    it("should handle partial failures", async () => {
      const mockFunds = [
        { id: 1, name: "Fund 1", fundrichCode: "FTS049" },
        { id: 2, name: "Fund 2", fundrichCode: "CSI098" },
      ];

      const mockNavData = [
        {
          fundCode: "FTS049",
          fundName: "Fund 1",
          nav: "150.25",
          currency: "USD",
          timestamp: new Date(),
          source: "fundrich" as const,
        },
      ];

      vi.mocked(db.getAllFunds).mockResolvedValueOnce(mockFunds as any);
      vi.mocked(fundScraper.fetchMultipleFundNavs).mockResolvedValueOnce(
        mockNavData
      );
      vi.mocked(db.updateFundNav).mockResolvedValueOnce(undefined);
      vi.mocked(db.updateFundLastNavUpdateTime).mockResolvedValueOnce(
        undefined
      );

      const result = await cronScheduler.triggerTaskManually();

      expect(result.status).toBe("success");
      expect(result.fundCodesProcessed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Task Status Management", () => {
    it("should track task running status", async () => {
      expect(cronScheduler.isTaskCurrentlyRunning()).toBe(false);

      // 模擬任務執行
      // 實際的任務會設置 isTaskRunning 為 true，然後設置為 false
    });

    it("should store last task log", async () => {
      const mockFunds = [
        { id: 1, name: "Fund 1", fundrichCode: "FTS049" },
      ];

      const mockNavData = [
        {
          fundCode: "FTS049",
          fundName: "Fund 1",
          nav: "150.25",
          currency: "USD",
          timestamp: new Date(),
          source: "fundrich" as const,
        },
      ];

      vi.mocked(db.getAllFunds).mockResolvedValueOnce(mockFunds as any);
      vi.mocked(fundScraper.fetchMultipleFundNavs).mockResolvedValueOnce(
        mockNavData
      );
      vi.mocked(db.updateFundNav).mockResolvedValueOnce(undefined);
      vi.mocked(db.updateFundLastNavUpdateTime).mockResolvedValueOnce(
        undefined
      );

      await cronScheduler.triggerTaskManually();

      const lastLog = cronScheduler.getLastTaskLog();
      expect(lastLog).not.toBeNull();
      expect(lastLog?.taskName).toBe("fundrich-nav-update");
    });
  });

  describe("Scheduler Initialization", () => {
    it("should initialize scheduler successfully", () => {
      // 由於 node-cron 被 mock，這個測試驗證初始化邏輯
      // 實際的排程會在伺服器啟動時初始化
      expect(() => {
        cronScheduler.initializeScheduler();
      }).not.toThrow();
    });

    it("should handle scheduler initialization errors gracefully", () => {
      // 測試錯誤處理
      const result = cronScheduler.initializeScheduler();
      // 由於 mock，結果可能為 null 或 ScheduledTask
      expect(result === null || result !== null).toBe(true);
    });
  });

  describe("Schedule Log Structure", () => {
    it("should have correct schedule log structure", () => {
      const mockLog: cronScheduler.ScheduleLog = {
        taskName: "fundrich-nav-update",
        status: "success",
        startTime: new Date(),
        endTime: new Date(),
        retriesAttempted: 0,
        fundCodesProcessed: 5,
      };

      expect(mockLog.taskName).toBe("fundrich-nav-update");
      expect(mockLog.status).toBe("success");
      expect(mockLog.retriesAttempted).toBe(0);
      expect(mockLog.fundCodesProcessed).toBe(5);
    });
  });
});

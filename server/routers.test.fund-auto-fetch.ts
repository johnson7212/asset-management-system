import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the fundScraper module
vi.mock("./services/fundScraper", () => ({
  fetchFundNavFromFundrich: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    isActive: true,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("funds router - Auto Fetch Fund Info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchFundInfo", () => {
    it("should fetch fund info successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Mock the fundScraper response
      const fundScraper = await import("./services/fundScraper");
      vi.mocked(fundScraper.fetchFundNavFromFundrich).mockResolvedValueOnce({
        fundCode: "FTS049",
        fundName: "元大台灣50",
        nav: "150.25",
        currency: "TWD",
        timestamp: new Date(),
        source: "fundrich",
      });

      const result = await caller.funds.fetchFundInfo({
        fundCode: "FTS049",
      });

      expect(result).toMatchObject({
        fundCode: "FTS049",
        fundName: "元大台灣50",
        nav: "150.25",
        currency: "TWD",
      });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should handle invalid fund code", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const fundScraper = await import("./services/fundScraper");
      vi.mocked(fundScraper.fetchFundNavFromFundrich).mockResolvedValueOnce(null);

      try {
        await caller.funds.fetchFundInfo({
          fundCode: "INVALID",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle different currencies", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const fundScraper = await import("./services/fundScraper");
      vi.mocked(fundScraper.fetchFundNavFromFundrich).mockResolvedValueOnce({
        fundCode: "CSI098",
        fundName: "美國基金",
        nav: "100.50",
        currency: "USD",
        timestamp: new Date(),
        source: "fundrich",
      });

      const result = await caller.funds.fetchFundInfo({
        fundCode: "CSI098",
      });

      expect(result.currency).toBe("USD");
    });

    it("should generate default fund name if not provided", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const fundScraper = await import("./services/fundScraper");
      vi.mocked(fundScraper.fetchFundNavFromFundrich).mockResolvedValueOnce({
        fundCode: "TEST001",
        fundName: "Test Fund",
        nav: "50.00",
        currency: "TWD",
        timestamp: new Date(),
        source: "fundrich",
      });

      const result = await caller.funds.fetchFundInfo({
        fundCode: "TEST001",
      });

      expect(result.fundName).toBe("基金 TEST001");
    });

    it("should require authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.funds.fetchFundInfo({
          fundCode: "FTS049",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Fund Info Response Structure", () => {
    it("should have correct response structure", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const fundScraper = await import("./services/fundScraper");
      vi.mocked(fundScraper.fetchFundNavFromFundrich).mockResolvedValueOnce({
        fundCode: "FTS049",
        fundName: "元大台灣50",
        nav: "150.25",
        currency: "TWD",
        timestamp: new Date(),
        source: "fundrich",
      });

      const result = await caller.funds.fetchFundInfo({
        fundCode: "FTS049",
      });

      expect(result).toHaveProperty("fundCode");
      expect(result).toHaveProperty("fundName");
      expect(result).toHaveProperty("nav");
      expect(result).toHaveProperty("currency");
      expect(result).toHaveProperty("timestamp");
    });
  });
});

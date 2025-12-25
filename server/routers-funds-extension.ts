/**
 * 基金 API 擴展 - 用於替換 routers.ts 中的 funds router
 * 包含淨值自動更新功能
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as fundApi from "./services/fundApi";

export const fundsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllFunds();
  }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      code: z.string().optional(),
      nav: z.string().optional(),
      currencyId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.createFund(input);
      return { success: true };
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteFund(input.id);
      return { success: true };
    }),
  
  updateNav: adminProcedure
    .input(z.object({
      id: z.number(),
      nav: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.updateFundNav(input.id, input.nav);
      return { success: true };
    }),
  
  fetchNav: protectedProcedure
    .input(z.object({
      id: z.number(),
      fundCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const fund = await db.getFundById(input.id);
      if (!fund) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '基金不存在' });
      }
      
      const fundCode = input.fundCode || fund.code;
      if (!fundCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '基金代碼不存在' });
      }
      
      const navData = await fundApi.fetchFundNav(fundCode, fund.name);
      if (!navData) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '無法獲取基金淨值' });
      }
      
      await db.updateFundNav(input.id, navData.nav);
      return { success: true, nav: navData.nav, timestamp: navData.timestamp };
    }),
  
  fetchMultipleNavs: adminProcedure
    .input(z.object({
      fundIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const funds = await db.getFundsByIds(input.fundIds);
      const results = [];
      
      for (const fund of funds) {
        if (!fund.code) continue;
        
        const navData = await fundApi.fetchFundNav(fund.code, fund.name);
        if (navData) {
          await db.updateFundNav(fund.id, navData.nav);
          results.push({
            fundId: fund.id,
            name: fund.name,
            nav: navData.nav,
            timestamp: navData.timestamp,
          });
        }
        // 避免觸發 API 速率限制
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      
      return { success: true, updated: results };
    }),
});

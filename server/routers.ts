import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User Management (Admin only)
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(['user', 'admin']).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateUser(id, data);
        return { success: true };
      }),
  }),

  // Currency Management
  currencies: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCurrencies();
    }),
    
    updateRate: adminProcedure
      .input(z.object({
        id: z.number(),
        exchangeRate: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateCurrencyRate(input.id, input.exchangeRate);
        return { success: true };
      }),
  }),

  // Bank Management
  banks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBanksByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        code: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createBank({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteBank(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Bank Deposit Management
  deposits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBankDepositsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        bankId: z.number(),
        currencyId: z.number(),
        amount: z.string(),
        costTwd: z.string().optional(),
        interestRate: z.string().optional(),
        monthlyInvestment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createBankDeposit({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.string().optional(),
        costTwd: z.string().optional(),
        interestRate: z.string().optional(),
        monthlyInvestment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateBankDeposit(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteBankDeposit(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Fund Management
  funds: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllFunds();
    }),
    
    create: adminProcedure
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
    
    updateNav: adminProcedure
      .input(z.object({
        id: z.number(),
        nav: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateFundNav(input.id, input.nav);
        return { success: true };
      }),
  }),

  // Fund Holding Management
  fundHoldings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFundHoldingsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        bankId: z.number(),
        fundId: z.number(),
        units: z.string(),
        avgCost: z.string(),
        inTransitAmount: z.string().optional(),
        purchaseDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createFundHolding({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        units: z.string().optional(),
        avgCost: z.string().optional(),
        inTransitAmount: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateFundHolding(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFundHolding(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Fund Dividend Management
  fundDividends: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFundDividendsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        holdingId: z.number(),
        amount: z.string(),
        currencyId: z.number(),
        paymentDate: z.date(),
        source: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createFundDividend({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // Stock Holding Management
  stockHoldings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getStockHoldingsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        bankId: z.number(),
        symbol: z.string(),
        name: z.string().optional(),
        shares: z.string(),
        avgCost: z.string(),
        currencyId: z.number(),
        marketType: z.enum(['US', 'TW']),
        purchaseDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createStockHolding({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        shares: z.string().optional(),
        avgCost: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateStockHolding(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteStockHolding(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Stock Dividend Management
  stockDividends: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getStockDividendsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        holdingId: z.number(),
        amount: z.string(),
        currencyId: z.number(),
        paymentDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createStockDividend({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // Crypto Holding Management
  cryptoHoldings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCryptoHoldingsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        exchange: z.string(),
        symbol: z.string(),
        name: z.string().optional(),
        amount: z.string(),
        stakedAmount: z.string().optional(),
        avgCost: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCryptoHolding({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.string().optional(),
        stakedAmount: z.string().optional(),
        avgCost: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCryptoHolding(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCryptoHolding(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Transaction Management
  transactions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTransactionsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        assetType: z.enum(['fund', 'stock', 'crypto', 'deposit']),
        assetId: z.number(),
        transactionType: z.enum(['buy', 'sell', 'dividend', 'deposit', 'withdraw']),
        amount: z.string(),
        price: z.string().optional(),
        totalValue: z.string(),
        currencyId: z.number(),
        transactionDate: z.date(),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTransaction({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

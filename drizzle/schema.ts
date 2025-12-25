import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Currency table - 幣別表
 */
export const currencies = mysqlTable("currencies", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // USD, TWD, ZAR, JPY, EUR, CNY, AUD
  name: varchar("name", { length: 50 }).notNull(), // 美金, 台幣, 南非幣, 日幣, 歐元, 人民幣, 澳幣
  symbol: varchar("symbol", { length: 10 }), // $, NT$, R, ¥, €, ¥, A$
  exchangeRate: decimal("exchangeRate", { precision: 12, scale: 6 }).notNull(), // 對台幣匯率
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = typeof currencies.$inferInsert;

/**
 * Bank table - 銀行表
 */
export const banks = mysqlTable("banks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // 玉山銀行, 永豐銀行, 國泰世華銀行, 凱基銀行
  code: varchar("code", { length: 20 }), // Bank code
  userId: int("userId").notNull(), // 所屬使用者
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type Bank = typeof banks.$inferSelect;
export type InsertBank = typeof banks.$inferInsert;

/**
 * Bank Deposit table - 銀行存款表
 */
export const bankDeposits = mysqlTable("bankDeposits", {
  id: int("id").autoincrement().primaryKey(),
  bankId: int("bankId").notNull(),
  userId: int("userId").notNull(),
  currencyId: int("currencyId").notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(), // 存款金額 (外幣)
  costTwd: decimal("costTwd", { precision: 20, scale: 2 }), // 台幣成本
  interestRate: decimal("interestRate", { precision: 5, scale: 4 }), // 利率
  monthlyInvestment: decimal("monthlyInvestment", { precision: 20, scale: 2 }), // 每月投入金額
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  bankIdIdx: index("bankId_idx").on(table.bankId),
}));

export type BankDeposit = typeof bankDeposits.$inferSelect;
export type InsertBankDeposit = typeof bankDeposits.$inferInsert;

/**
 * Fund table - 基金清單表
 */
export const funds = mysqlTable("funds", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // 基金名稱
  code: varchar("code", { length: 50 }), // 基金代碼
  nav: decimal("nav", { precision: 20, scale: 6 }), // 淨值 (Net Asset Value)
  currencyId: int("currencyId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  codeIdx: index("code_idx").on(table.code),
}));

export type Fund = typeof funds.$inferSelect;
export type InsertFund = typeof funds.$inferInsert;

/**
 * Fund Holding table - 基金持倉表
 */
export const fundHoldings = mysqlTable("fundHoldings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankId: int("bankId").notNull(),
  fundId: int("fundId").notNull(),
  units: decimal("units", { precision: 20, scale: 6 }).notNull(), // 單位數
  avgCost: decimal("avgCost", { precision: 20, scale: 6 }).notNull(), // 平均成本
  inTransitAmount: decimal("inTransitAmount", { precision: 20, scale: 2 }), // 在途金額 (申購中)
  purchaseDate: timestamp("purchaseDate"), // 首購日
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  bankIdIdx: index("bankId_idx").on(table.bankId),
  fundIdIdx: index("fundId_idx").on(table.fundId),
}));

export type FundHolding = typeof fundHoldings.$inferSelect;
export type InsertFundHolding = typeof fundHoldings.$inferInsert;

/**
 * Fund Dividend table - 基金配息記錄表
 */
export const fundDividends = mysqlTable("fundDividends", {
  id: int("id").autoincrement().primaryKey(),
  holdingId: int("holdingId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(), // 配息金額 (原幣)
  currencyId: int("currencyId").notNull(),
  paymentDate: timestamp("paymentDate").notNull(), // 配息日期
  source: varchar("source", { length: 50 }), // 來源銀行/平台
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  holdingIdIdx: index("holdingId_idx").on(table.holdingId),
}));

export type FundDividend = typeof fundDividends.$inferSelect;
export type InsertFundDividend = typeof fundDividends.$inferInsert;

/**
 * Stock Holding table - 股票持倉表
 */
export const stockHoldings = mysqlTable("stockHoldings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankId: int("bankId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(), // 股票代碼 (AAPL, 2330.TW)
  name: varchar("name", { length: 255 }), // 股票名稱
  shares: decimal("shares", { precision: 20, scale: 6 }).notNull(), // 股數
  avgCost: decimal("avgCost", { precision: 20, scale: 6 }).notNull(), // 平均成本
  currencyId: int("currencyId").notNull(),
  marketType: mysqlEnum("marketType", ["US", "TW"]).default("US").notNull(), // 市場類型
  purchaseDate: timestamp("purchaseDate"), // 購買日期
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  bankIdIdx: index("bankId_idx").on(table.bankId),
  symbolIdx: index("symbol_idx").on(table.symbol),
}));

export type StockHolding = typeof stockHoldings.$inferSelect;
export type InsertStockHolding = typeof stockHoldings.$inferInsert;

/**
 * Stock Dividend table - 股票配息記錄表
 */
export const stockDividends = mysqlTable("stockDividends", {
  id: int("id").autoincrement().primaryKey(),
  holdingId: int("holdingId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(), // 配息金額 (原幣)
  currencyId: int("currencyId").notNull(),
  paymentDate: timestamp("paymentDate").notNull(), // 配息日期
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  holdingIdIdx: index("holdingId_idx").on(table.holdingId),
}));

export type StockDividend = typeof stockDividends.$inferSelect;
export type InsertStockDividend = typeof stockDividends.$inferInsert;

/**
 * Crypto Holding table - 虛擬資產持倉表
 */
export const cryptoHoldings = mysqlTable("cryptoHoldings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exchange: varchar("exchange", { length: 50 }).notNull(), // 交易所: Binance, Bybit, OKX, Crypto.com, gate, MAX, 幣託
  symbol: varchar("symbol", { length: 20 }).notNull(), // 幣種代碼: BTC, ETH, USDT
  name: varchar("name", { length: 100 }), // 幣種名稱
  amount: decimal("amount", { precision: 30, scale: 10 }).notNull(), // 持有數量
  stakedAmount: decimal("stakedAmount", { precision: 30, scale: 10 }), // 質押數量
  avgCost: decimal("avgCost", { precision: 20, scale: 6 }), // 平均成本 (TWD)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  exchangeIdx: index("exchange_idx").on(table.exchange),
}));

export type CryptoHolding = typeof cryptoHoldings.$inferSelect;
export type InsertCryptoHolding = typeof cryptoHoldings.$inferInsert;

/**
 * Transaction table - 交易記錄表
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assetType: mysqlEnum("assetType", ["fund", "stock", "crypto", "deposit"]).notNull(), // 資產類型
  assetId: int("assetId").notNull(), // 關聯的資產 ID
  transactionType: mysqlEnum("transactionType", ["buy", "sell", "dividend", "deposit", "withdraw"]).notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(), // 數量
  price: decimal("price", { precision: 20, scale: 6 }), // 價格
  totalValue: decimal("totalValue", { precision: 20, scale: 2 }).notNull(), // 總金額
  currencyId: int("currencyId").notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  note: text("note"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  assetTypeIdx: index("assetType_idx").on(table.assetType),
  transactionDateIdx: index("transactionDate_idx").on(table.transactionDate),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  currencies,
  banks,
  bankDeposits,
  funds,
  fundHoldings,
  fundDividends,
  stockHoldings,
  stockDividends,
  cryptoHoldings,
  transactions
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    // Set role to admin for owner or if explicitly specified
    if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    } else if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// User Management
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, id));
}

// Currency Management
export async function getAllCurrencies() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(currencies);
}

export async function getCurrencyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(currencies).where(eq(currencies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCurrencyRate(id: number, exchangeRate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(currencies).set({ exchangeRate }).where(eq(currencies.id, id));
}

// Bank Management
export async function getBanksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(banks).where(eq(banks.userId, userId));
}

export async function createBank(data: typeof banks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(banks).values(data);
  return result;
}

export async function deleteBank(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(banks).where(and(eq(banks.id, id), eq(banks.userId, userId)));
}

// Bank Deposit Management
export async function getBankDepositsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bankDeposits).where(eq(bankDeposits.userId, userId));
}

export async function createBankDeposit(data: typeof bankDeposits.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bankDeposits).values(data);
  return result;
}

export async function updateBankDeposit(id: number, userId: number, data: Partial<typeof bankDeposits.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bankDeposits).set(data).where(and(eq(bankDeposits.id, id), eq(bankDeposits.userId, userId)));
}

export async function deleteBankDeposit(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bankDeposits).where(and(eq(bankDeposits.id, id), eq(bankDeposits.userId, userId)));
}

// Fund Management
export async function getAllFunds() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(funds);
}

export async function createFund(data: typeof funds.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(funds).values(data);
  return result;
}

export async function updateFundNav(id: number, nav: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(funds).set({ nav }).where(eq(funds.id, id));
}

export async function deleteFund(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(funds).where(eq(funds.id, id));
}

// Fund Holding Management
export async function getFundHoldingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fundHoldings).where(eq(fundHoldings.userId, userId));
}

export async function createFundHolding(data: typeof fundHoldings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fundHoldings).values(data);
  return result;
}

export async function updateFundHolding(id: number, userId: number, data: Partial<typeof fundHoldings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(fundHoldings).set(data).where(and(eq(fundHoldings.id, id), eq(fundHoldings.userId, userId)));
}

export async function deleteFundHolding(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(fundHoldings).where(and(eq(fundHoldings.id, id), eq(fundHoldings.userId, userId)));
}

// Fund Dividend Management
export async function getFundDividendsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(fundDividends).where(eq(fundDividends.userId, userId));
}

export async function createFundDividend(data: typeof fundDividends.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fundDividends).values(data);
  return result;
}

// Stock Holding Management
export async function getStockHoldingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stockHoldings).where(eq(stockHoldings.userId, userId));
}

export async function createStockHolding(data: typeof stockHoldings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockHoldings).values(data);
  return result;
}

export async function updateStockHolding(id: number, userId: number, data: Partial<typeof stockHoldings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stockHoldings).set(data).where(and(eq(stockHoldings.id, id), eq(stockHoldings.userId, userId)));
}

export async function deleteStockHolding(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(stockHoldings).where(and(eq(stockHoldings.id, id), eq(stockHoldings.userId, userId)));
}

// Stock Dividend Management
export async function getStockDividendsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stockDividends).where(eq(stockDividends.userId, userId));
}

export async function createStockDividend(data: typeof stockDividends.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stockDividends).values(data);
  return result;
}

// Crypto Holding Management
export async function getCryptoHoldingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cryptoHoldings).where(eq(cryptoHoldings.userId, userId));
}

export async function createCryptoHolding(data: typeof cryptoHoldings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cryptoHoldings).values(data);
  return result;
}

export async function updateCryptoHolding(id: number, userId: number, data: Partial<typeof cryptoHoldings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cryptoHoldings).set(data).where(and(eq(cryptoHoldings.id, id), eq(cryptoHoldings.userId, userId)));
}

export async function deleteCryptoHolding(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cryptoHoldings).where(and(eq(cryptoHoldings.id, id), eq(cryptoHoldings.userId, userId)));
}

// Transaction Management
export async function getTransactionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions).where(eq(transactions.userId, userId));
}

export async function createTransaction(data: typeof transactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(data);
  return result;
}

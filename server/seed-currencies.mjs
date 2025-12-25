import { drizzle } from "drizzle-orm/mysql2";
import { currencies } from "../drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const initialCurrencies = [
  { code: 'TWD', name: '台幣', symbol: 'NT$', exchangeRate: '1.000000' },
  { code: 'USD', name: '美金', symbol: '$', exchangeRate: '31.461000' },
  { code: 'ZAR', name: '南非幣', symbol: 'R', exchangeRate: '1.869000' },
  { code: 'JPY', name: '日幣', symbol: '¥', exchangeRate: '0.201200' },
  { code: 'EUR', name: '歐元', symbol: '€', exchangeRate: '37.070000' },
  { code: 'CNY', name: '人民幣', symbol: '¥', exchangeRate: '4.484000' },
  { code: 'AUD', name: '澳幣', symbol: 'A$', exchangeRate: '21.070000' },
];

async function seed() {
  console.log('Seeding currencies...');
  
  for (const currency of initialCurrencies) {
    try {
      await db.insert(currencies).values(currency).onDuplicateKeyUpdate({
        set: { exchangeRate: currency.exchangeRate }
      });
      console.log(`✓ ${currency.name} (${currency.code})`);
    } catch (error) {
      console.error(`✗ Failed to seed ${currency.code}:`, error.message);
    }
  }
  
  console.log('Seeding completed!');
  process.exit(0);
}

seed();

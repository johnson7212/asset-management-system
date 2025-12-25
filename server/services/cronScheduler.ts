/**
 * 定時排程服務 - 每小時自動執行基富通淨值擷取
 * 支援失敗重試機制（指數退避策略）
 */

import cron, { ScheduledTask } from "node-cron";
import * as fundScraper from "./fundScraper";
import * as db from "../db";

export interface ScheduleLog {
  id?: number;
  taskName: string;
  status: "pending" | "running" | "success" | "failed";
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
  retriesAttempted: number;
  fundCodesProcessed?: number;
}

// 定時任務狀態
let isTaskRunning = false;
let lastTaskLog: ScheduleLog | null = null;

/**
 * 重試配置
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 5000, // 5 秒
  maxDelayMs: 60000, // 60 秒
};

/**
 * 計算指數退避延遲時間
 */
function calculateBackoffDelay(attemptNumber: number): number {
  const delay = RETRY_CONFIG.initialDelayMs * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * 等待指定時間
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 執行基富通淨值擷取任務
 */
async function executeFundNavUpdateTask(): Promise<ScheduleLog> {
  const taskLog: ScheduleLog = {
    taskName: "fundrich-nav-update",
    status: "running",
    startTime: new Date(),
    retriesAttempted: 0,
    fundCodesProcessed: 0,
  };

  try {
    console.log("[CronScheduler] Starting fund NAV update task...");

    // 獲取所有需要更新的基金（有基富通代碼的基金）
    const funds = await db.getAllFunds();
    const fundsToUpdate = funds.filter((f) => f.fundrichCode);

    if (fundsToUpdate.length === 0) {
      console.log("[CronScheduler] No funds with fundrich code found");
      taskLog.status = "success";
      taskLog.fundCodesProcessed = 0;
      taskLog.endTime = new Date();
      return taskLog;
    }

    console.log(
      `[CronScheduler] Found ${fundsToUpdate.length} funds to update`
    );

    // 批量擷取基金淨值
    const navDataList = await fundScraper.fetchMultipleFundNavs(
      fundsToUpdate.map((f) => ({
        code: f.fundrichCode || "",
        name: f.name,
      }))
    );

    console.log(`[CronScheduler] Successfully fetched ${navDataList.length} NAVs`);

    // 更新資料庫中的淨值
    let successCount = 0;
    for (const navData of navDataList) {
      try {
        const fund = fundsToUpdate.find((f) => f.fundrichCode === navData.fundCode);
        if (fund) {
          await db.updateFundNav(fund.id, navData.nav);
          // 更新最後更新時間
          await db.updateFundLastNavUpdateTime(fund.id, new Date());
          successCount++;
        }
      } catch (error) {
        console.error(
          `[CronScheduler] Failed to update fund ${navData.fundCode}:`,
          error
        );
      }
    }

    taskLog.status = "success";
    taskLog.fundCodesProcessed = successCount;
    taskLog.endTime = new Date();

    console.log(
      `[CronScheduler] Task completed successfully. Updated ${successCount} funds`
    );

    return taskLog;
  } catch (error) {
    console.error("[CronScheduler] Task failed:", error);
    taskLog.status = "failed";
    taskLog.errorMessage =
      error instanceof Error ? error.message : String(error);
    taskLog.endTime = new Date();
    return taskLog;
  }
}

/**
 * 執行任務並支援重試
 */
async function executeTaskWithRetry(): Promise<void> {
  if (isTaskRunning) {
    console.log("[CronScheduler] Task already running, skipping...");
    return;
  }

  isTaskRunning = true;

  try {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const taskLog = await executeFundNavUpdateTask();
        lastTaskLog = taskLog;

        if (taskLog.status === "success") {
          console.log("[CronScheduler] Task completed successfully");
          return;
        }

        lastError = new Error(taskLog.errorMessage || "Unknown error");

        if (attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = calculateBackoffDelay(attempt);
          console.log(
            `[CronScheduler] Attempt ${attempt} failed, retrying in ${delayMs}ms...`
          );
          await sleep(delayMs);
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        if (attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = calculateBackoffDelay(attempt);
          console.log(
            `[CronScheduler] Attempt ${attempt} failed with error: ${lastError.message}`
          );
          console.log(`[CronScheduler] Retrying in ${delayMs}ms...`);
          await sleep(delayMs);
        }
      }
    }

    // 所有重試都失敗
    console.error(
      `[CronScheduler] Task failed after ${RETRY_CONFIG.maxRetries} attempts:`,
      lastError
    );

    lastTaskLog = {
      taskName: "fundrich-nav-update",
      status: "failed",
      startTime: new Date(),
      endTime: new Date(),
      retriesAttempted: RETRY_CONFIG.maxRetries,
      errorMessage: lastError?.message || "Unknown error",
    };
  } finally {
    isTaskRunning = false;
  }
}

/**
 * 初始化排程
 * 每小時執行一次（在每小時的第 0 分鐘）
 */
export function initializeScheduler(): ScheduledTask | null {
  try {
    // Cron 表達式: 0 * * * * * (每小時的第 0 分鐘)
    const task = cron.schedule("0 * * * *", async () => {
      console.log(`[CronScheduler] Cron job triggered at ${new Date()}`);
      await executeTaskWithRetry();
    });

    console.log("[CronScheduler] Fund NAV update scheduler initialized");
    console.log("[CronScheduler] Schedule: Every hour at minute 0");

    return task;
  } catch (error) {
    console.error("[CronScheduler] Failed to initialize scheduler:", error);
    return null;
  }
}

/**
 * 停止排程
 */
export function stopScheduler(task: ScheduledTask | null): void {
  if (task) {
    task.stop();
    console.log("[CronScheduler] Scheduler stopped");
  }
}

/**
 * 手動觸發任務
 */
export async function triggerTaskManually(): Promise<ScheduleLog> {
  console.log("[CronScheduler] Manual task trigger requested");
  await executeTaskWithRetry();
  return (
    lastTaskLog || {
      taskName: "fundrich-nav-update",
      status: "failed",
      startTime: new Date(),
      retriesAttempted: 0,
      errorMessage: "Task execution failed",
    }
  );
}

/**
 * 獲取最後一次任務執行日誌
 */
export function getLastTaskLog(): ScheduleLog | null {
  return lastTaskLog;
}

/**
 * 獲取任務運行狀態
 */
export function isTaskCurrentlyRunning(): boolean {
  return isTaskRunning;
}

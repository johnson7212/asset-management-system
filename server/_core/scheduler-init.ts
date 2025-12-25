/**
 * 排程初始化模組
 * 在伺服器啟動時初始化基富通淨值更新排程
 */

import { initializeScheduler, stopScheduler } from "../services/cronScheduler";
import type { ScheduledTask } from "node-cron";

let schedulerTask: ScheduledTask | null = null;

/**
 * 啟動排程
 */
export function startScheduler(): void {
  try {
    console.log("[SchedulerInit] Starting fund NAV update scheduler...");
    schedulerTask = initializeScheduler();
    
    if (schedulerTask) {
      console.log("[SchedulerInit] Scheduler started successfully");
    } else {
      console.warn("[SchedulerInit] Failed to start scheduler");
    }
  } catch (error) {
    console.error("[SchedulerInit] Error starting scheduler:", error);
  }
}

/**
 * 停止排程
 */
export function stopSchedulerGracefully(): void {
  try {
    console.log("[SchedulerInit] Stopping scheduler...");
    stopScheduler(schedulerTask);
    schedulerTask = null;
    console.log("[SchedulerInit] Scheduler stopped");
  } catch (error) {
    console.error("[SchedulerInit] Error stopping scheduler:", error);
  }
}

/**
 * 獲取排程狀態
 */
export function getSchedulerStatus(): {
  isRunning: boolean;
  lastStartTime?: Date;
} {
  return {
    isRunning: schedulerTask !== null,
  };
}

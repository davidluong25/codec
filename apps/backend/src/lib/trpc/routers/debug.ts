import { router, publicProcedure } from "../index"
import { getDatabase, projects, chats, subChats } from "../../db"
import { z } from "zod"
import { clearNetworkCache } from "../../ollama/network-detector"

const IS_DEV = process.env.NODE_ENV === "development"

// Global flag for simulating offline mode (for testing)
let simulateOfflineMode = false

/**
 * Check if offline mode is being simulated (for testing)
 * Used by network-detector.ts
 */
export function isOfflineSimulated(): boolean {
  return simulateOfflineMode
}

// Stub: auth manager for web backend
// TODO: implement proper web auth
function getAuthManager() {
  return {
    logout: () => { console.log("[Debug] Logout stubbed in web mode") },
  }
}

export const debugRouter = router({
  /**
   * Get system information for debug display
   */
  getSystemInfo: publicProcedure.query(() => {
    const userDataPath = process.env.DATA_DIR || process.cwd()

    return {
      version: process.env.APP_VERSION || "0.0.58",
      platform: process.platform,
      arch: process.arch,
      isDev: IS_DEV,
      userDataPath,
      protocolRegistered: false,
    }
  }),

  /**
   * Get database statistics
   */
  getDbStats: publicProcedure.query(() => {
    const db = getDatabase()
    const projectCount = db.select().from(projects).all().length
    const chatCount = db.select().from(chats).all().length
    const subChatCount = db.select().from(subChats).all().length

    return {
      projects: projectCount,
      chats: chatCount,
      subChats: subChatCount,
    }
  }),

  /**
   * Clear all chats and sub-chats (keeps projects)
   */
  clearChats: publicProcedure.mutation(() => {
    const db = getDatabase()
    // Delete sub_chats first (foreign key constraint)
    db.delete(subChats).run()
    db.delete(chats).run()
    console.log("[Debug] Cleared all chats and sub-chats")
    return { success: true }
  }),

  /**
   * Clear all data (projects, chats, sub-chats)
   */
  clearAllData: publicProcedure.mutation(() => {
    const db = getDatabase()
    // Delete in order due to foreign key constraints
    db.delete(subChats).run()
    db.delete(chats).run()
    db.delete(projects).run()
    console.log("[Debug] Cleared all database data")
    return { success: true }
  }),

  /**
   * Logout (clear auth only)
   */
  logout: publicProcedure.mutation(() => {
    const authManager = getAuthManager()
    authManager.logout()
    console.log("[Debug] User logged out")
    return { success: true }
  }),

  /**
   * Open userData folder - returns path for frontend to handle
   */
  openUserDataFolder: publicProcedure.mutation(() => {
    const userDataPath = process.env.DATA_DIR || process.cwd()
    console.log("[Debug] userData folder:", userDataPath)
    return { success: true, path: userDataPath }
  }),

  /**
   * Get offline simulation status
   */
  getOfflineSimulation: publicProcedure.query(() => {
    return { enabled: simulateOfflineMode }
  }),

  /**
   * Set offline simulation status (for testing)
   */
  setOfflineSimulation: publicProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(({ input }) => {
      simulateOfflineMode = input.enabled
      // Clear network cache to force immediate re-check
      clearNetworkCache()
      console.log(`[Debug] Offline simulation ${input.enabled ? "enabled" : "disabled"}`)
      return { success: true, enabled: simulateOfflineMode }
    }),
})

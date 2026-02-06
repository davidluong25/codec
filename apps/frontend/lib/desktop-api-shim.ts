/**
 * Web-compatible shim for desktopApi
 * Replaces Electron IPC bridge with web-compatible implementations
 */

export interface DesktopApi {
  platform: string
  arch: string
  getVersion: () => Promise<string>
  isPackaged: () => Promise<boolean>

  // Auto-update (no-ops in web mode)
  checkForUpdates: (force?: boolean) => Promise<null>
  downloadUpdate: () => Promise<boolean>
  installUpdate: () => void
  setUpdateChannel: (channel: "latest" | "beta") => Promise<boolean>
  getUpdateChannel: () => Promise<"latest" | "beta">
  onUpdateChecking: (callback: () => void) => () => void
  onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string }) => void) => () => void
  onUpdateNotAvailable: (callback: () => void) => () => void
  onUpdateProgress: (callback: (progress: { percent: number }) => void) => () => void
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void
  onUpdateError: (callback: (error: string) => void) => () => void
  onUpdateManualCheck: (callback: () => void) => () => void

  // Window controls (no-ops in web mode)
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowIsMaximized: () => Promise<boolean>
  windowToggleFullscreen: () => Promise<void>
  windowIsFullscreen: () => Promise<boolean>
  setTrafficLightVisibility: (visible: boolean) => Promise<void>
  setWindowFramePreference: (useNativeFrame: boolean) => Promise<boolean>
  getWindowFrameState: () => Promise<boolean>
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void
  onFocusChange: (callback: (isFocused: boolean) => void) => () => void
  zoomIn: () => Promise<void>
  zoomOut: () => Promise<void>
  zoomReset: () => Promise<void>
  getZoom: () => Promise<number>

  // Multi-window
  newWindow: (options?: { chatId?: string; subChatId?: string }) => Promise<void>
  setWindowTitle: (title: string) => Promise<void>
  toggleDevTools: () => Promise<void>
  unlockDevTools: () => Promise<void>
  setAnalyticsOptOut: (optedOut: boolean) => Promise<void>

  // Native features (web-compatible)
  setBadge: (count: number | null) => Promise<void>
  setBadgeIcon: (imageData: string | null) => Promise<void>
  showNotification: (options: { title: string; body: string }) => Promise<void>
  openExternal: (url: string) => Promise<void>
  getApiBaseUrl: () => Promise<string>

  // Clipboard
  clipboardWrite: (text: string) => Promise<void>
  clipboardRead: () => Promise<string>

  // Save file
  saveFile: (options: { base64Data: string; filename: string }) => Promise<{ success: boolean; filePath?: string }>

  // Auth
  getUser: () => Promise<{ id: string; email: string; name: string | null; imageUrl: string | null; username: string | null } | null>
  isAuthenticated: () => Promise<boolean>
  logout: () => Promise<void>
  startAuthFlow: () => Promise<void>
  submitAuthCode: (code: string) => Promise<void>
  updateUser: (updates: { name?: string }) => Promise<{ id: string; email: string; name: string | null; imageUrl: string | null; username: string | null } | null>
  getAuthToken: () => Promise<string | null>
  signedFetch: (url: string, options?: { method?: string; body?: string; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; data: unknown; error: string | null }>

  // Streaming
  streamFetch: (streamId: string, url: string, options?: { method?: string; body?: string; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; error?: string }>
  onStreamChunk: (streamId: string, callback: (chunk: Uint8Array) => void) => () => void
  onStreamDone: (streamId: string, callback: () => void) => () => void
  onStreamError: (streamId: string, callback: (error: string) => void) => () => void

  // Auth events
  onAuthSuccess: (callback: (user: any) => void) => () => void
  onAuthError: (callback: (error: string) => void) => () => void

  // Shortcuts
  onShortcutNewAgent: (callback: () => void) => () => void

  // File changes
  onFileChanged: (callback: (data: { filePath: string; type: string; subChatId: string }) => void) => () => void

  // Git status changes
  onGitStatusChanged: (callback: (data: { worktreePath: string; changes: Array<{ path: string; type: "add" | "change" | "unlink" }> }) => void) => () => void
  subscribeToGitWatcher: (worktreePath: string) => Promise<void>
  unsubscribeFromGitWatcher: (worktreePath: string) => Promise<void>

  // VS Code theme scanning
  scanVSCodeThemes: () => Promise<any[]>
  loadVSCodeTheme: (themePath: string) => Promise<any>
}

const noop = () => {}
const noopAsync = async () => {}
const noopCleanup = () => noop

/**
 * Web-compatible implementation of desktopApi
 */
export const webDesktopApi: DesktopApi = {
  platform: navigator.platform.includes("Mac") ? "darwin" : navigator.platform.includes("Win") ? "win32" : "linux",
  arch: "x64",
  getVersion: async () => "0.0.58-web",
  isPackaged: async () => false,

  // Auto-update (no-ops)
  checkForUpdates: async () => null,
  downloadUpdate: async () => false,
  installUpdate: noop,
  setUpdateChannel: async () => true,
  getUpdateChannel: async () => "latest",
  onUpdateChecking: noopCleanup,
  onUpdateAvailable: noopCleanup,
  onUpdateNotAvailable: noopCleanup,
  onUpdateProgress: noopCleanup,
  onUpdateDownloaded: noopCleanup,
  onUpdateError: noopCleanup,
  onUpdateManualCheck: noopCleanup,

  // Window controls (no-ops)
  windowMinimize: noopAsync,
  windowMaximize: noopAsync,
  windowClose: async () => { window.close() },
  windowIsMaximized: async () => false,
  windowToggleFullscreen: async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await document.documentElement.requestFullscreen()
    }
  },
  windowIsFullscreen: async () => !!document.fullscreenElement,
  setTrafficLightVisibility: noopAsync,
  setWindowFramePreference: async () => false,
  getWindowFrameState: async () => false,
  onFullscreenChange: (callback) => {
    const handler = () => callback(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  },
  onFocusChange: (callback) => {
    const focusHandler = () => callback(true)
    const blurHandler = () => callback(false)
    window.addEventListener("focus", focusHandler)
    window.addEventListener("blur", blurHandler)
    return () => {
      window.removeEventListener("focus", focusHandler)
      window.removeEventListener("blur", blurHandler)
    }
  },
  zoomIn: noopAsync,
  zoomOut: noopAsync,
  zoomReset: noopAsync,
  getZoom: async () => 1,

  // Multi-window
  newWindow: async (options) => {
    const params = new URLSearchParams()
    if (options?.chatId) params.set("chatId", options.chatId)
    if (options?.subChatId) params.set("subChatId", options.subChatId)
    window.open(`${window.location.origin}?${params.toString()}`, "_blank")
  },
  setWindowTitle: async (title) => { document.title = title },
  toggleDevTools: noopAsync,
  unlockDevTools: noopAsync,
  setAnalyticsOptOut: noopAsync,

  // Native features
  setBadge: noopAsync,
  setBadgeIcon: noopAsync,
  showNotification: async (options) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(options.title, { body: options.body })
    } else if ("Notification" in window && Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        new Notification(options.title, { body: options.body })
      }
    }
  },
  openExternal: async (url) => { window.open(url, "_blank") },
  getApiBaseUrl: async () => window.location.origin,

  // Clipboard
  clipboardWrite: async (text) => { await navigator.clipboard.writeText(text) },
  clipboardRead: async () => navigator.clipboard.readText(),

  // Save file
  saveFile: async (options) => {
    try {
      const byteCharacters = atob(options.base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray])
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = options.filename
      a.click()
      URL.revokeObjectURL(url)
      return { success: true }
    } catch {
      return { success: false }
    }
  },

  // Auth (stub - to be implemented)
  getUser: async () => null,
  isAuthenticated: async () => false,
  logout: noopAsync,
  startAuthFlow: noopAsync,
  submitAuthCode: noopAsync,
  updateUser: async () => null,
  getAuthToken: async () => null,
  signedFetch: async (url, options) => {
    try {
      const resp = await fetch(url, {
        method: options?.method || "GET",
        body: options?.body,
        headers: options?.headers,
      })
      const data = await resp.json()
      return { ok: resp.ok, status: resp.status, data, error: null }
    } catch (e) {
      return { ok: false, status: 0, data: null, error: String(e) }
    }
  },

  // Streaming
  streamFetch: async () => ({ ok: false, status: 0, error: "Not implemented in web mode" }),
  onStreamChunk: noopCleanup,
  onStreamDone: noopCleanup,
  onStreamError: noopCleanup,

  // Auth events
  onAuthSuccess: noopCleanup,
  onAuthError: noopCleanup,

  // Shortcuts
  onShortcutNewAgent: noopCleanup,

  // File changes
  onFileChanged: noopCleanup,

  // Git status changes
  onGitStatusChanged: noopCleanup,
  subscribeToGitWatcher: noopAsync,
  unsubscribeFromGitWatcher: noopAsync,

  // VS Code theme scanning
  scanVSCodeThemes: async () => [],
  loadVSCodeTheme: async () => ({}),
}

// Install the web shim globally
if (typeof window !== "undefined" && !window.desktopApi) {
  ;(window as any).desktopApi = webDesktopApi
  ;(window as any).webUtils = {
    getPathForFile: (file: File) => file.name,
  }
}

import { gitWatcherRegistry, type GitWatchEvent } from "./git-watcher";
import { gitCache } from "../cache";

/**
 * IPC Bridge for GitWatcher - Web backend stub.
 * In Electron, this used ipcMain/BrowserWindow for IPC.
 * In web mode, this will be replaced by WebSocket events.
 */

// Track active subscriptions per worktree
const activeSubscriptions: Map<string, { unsubscribe: () => void }> = new Map();

/**
 * Register git watcher handlers (no-op in web mode, will use WebSocket later)
 */
export function registerGitWatcherIPC(): void {
	console.log("[GitWatcher] IPC bridge stubbed for web mode - use WebSocket subscriptions instead")
}

/**
 * Cleanup subscriptions for a specific window (no-op in web mode)
 */
export function cleanupWindowSubscriptions(_windowId: number): void {
	// No-op in web mode
}

/**
 * Cleanup all watchers.
 * Call this when the app is shutting down.
 */
export async function cleanupGitWatchers(): Promise<void> {
	const subscriptions = Array.from(activeSubscriptions.values());
	for (const subscription of subscriptions) {
		subscription.unsubscribe();
	}
	activeSubscriptions.clear();

	await gitWatcherRegistry.disposeAll();
	console.log("[GitWatcher] All watchers cleaned up");
}

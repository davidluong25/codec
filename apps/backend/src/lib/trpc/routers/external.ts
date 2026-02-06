import { execFileSync, spawn } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import { z } from "zod";
import { publicProcedure, router } from "../index";
import {
	APP_META,
	externalAppSchema,
	type ExternalApp,
} from "@1code/shared";

function expandTilde(filePath: string): string {
	if (filePath.startsWith("~/") || filePath === "~") {
		return path.join(os.homedir(), filePath.slice(1));
	}
	return filePath;
}

function spawnAsync(command: string, args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			detached: true,
			stdio: "ignore",
		});
		child.unref();
		child.on("error", reject);
		// Resolve immediately — we just need to launch the app
		resolve();
	});
}

function openPathInApp(app: ExternalApp, targetPath: string): Promise<void> {
	const expandedPath = expandTilde(targetPath);

	if (app === "finder") {
		// In web mode, we can't use shell.showItemInFolder — just use 'open' on macOS
		return spawnAsync("open", ["-R", expandedPath]);
	}

	const meta = APP_META[app];
	return spawnAsync("open", ["-a", meta.macAppName, expandedPath]);
}

/**
 * External router for shell operations (open in finder, open in editor, etc.)
 */
export const externalRouter = router({
	openInFinder: publicProcedure
		.input(z.string())
		.mutation(async ({ input: inputPath }) => {
			const expandedPath = expandTilde(inputPath);
			// Use 'open -R' as a cross-platform-ish fallback
			await spawnAsync("open", ["-R", expandedPath]);
			return { success: true };
		}),

	openInApp: publicProcedure
		.input(
			z.object({
				path: z.string(),
				app: externalAppSchema,
			}),
		)
		.mutation(async ({ input }) => {
			await openPathInApp(input.app, input.path);
			return { success: true };
		}),

	copyPath: publicProcedure
		.input(z.string())
		.mutation(({ input: inputPath }) => {
			// In web mode, clipboard is handled on the frontend
			return { success: true, path: inputPath };
		}),

	openFileInEditor: publicProcedure
		.input(
			z.object({
				path: z.string(),
				cwd: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { cwd } = input;
			const filePath = input.path.startsWith("~")
				? input.path.replace("~", os.homedir())
				: input.path;

			// Try common code editors in order of preference
			const editors = [
				{ cmd: "cursor", args: [filePath] }, // Cursor
				{ cmd: "code", args: [filePath] }, // VS Code
				{ cmd: "subl", args: [filePath] }, // Sublime Text
				{ cmd: "atom", args: [filePath] }, // Atom
				{ cmd: "open", args: ["-t", filePath] }, // macOS default text editor
			];

			for (const editor of editors) {
				try {
					// Check if the command exists first
					execFileSync("which", [editor.cmd], { stdio: "ignore" });
					const child = spawn(editor.cmd, editor.args, {
						cwd: cwd || undefined,
						detached: true,
						stdio: "ignore",
					});
					child.unref();
					return { success: true, editor: editor.cmd };
				} catch {
					// Try next editor
					continue;
				}
			}

			// Fallback: return the path for frontend to handle
			return { success: true, editor: "default", path: filePath };
		}),

	openExternal: publicProcedure
		.input(z.string())
		.mutation(async ({ input: url }) => {
			// In web mode, return URL for frontend to open
			return { success: true, url };
		}),
});

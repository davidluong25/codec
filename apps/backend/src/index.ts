import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { trpcServer } from "@hono/trpc-server"
import { createAppRouter } from "./lib/trpc/routers"
import { initDatabase } from "./lib/db"

// Initialize database
initDatabase()

// Create Hono app
const app = new Hono()

// Enable CORS for frontend
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
)

// Health check
app.get("/health", (c) => c.json({ status: "ok", version: "0.0.58" }))

// Create tRPC router
const appRouter = createAppRouter()

// Mount tRPC at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: () => ({}),
  })
)

// Start server
const port = parseInt(process.env.PORT || "3001", 10)

console.log(`[Backend] Starting server on port ${port}...`)

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`[Backend] Server running at http://localhost:${info.port}`)
    console.log(`[Backend] tRPC endpoint: http://localhost:${info.port}/trpc`)
  }
)

// Export type for frontend
export type { AppRouter } from "./lib/trpc/routers"

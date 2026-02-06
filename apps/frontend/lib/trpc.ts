import { createTRPCReact } from "@trpc/react-query"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@1code/backend/src/lib/trpc/routers"
import superjson from "superjson"

const TRPC_URL = "/trpc"

/**
 * React hooks for tRPC
 */
export const trpc = createTRPCReact<AppRouter>()

/**
 * Vanilla client for use outside React components (stores, utilities)
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_URL,
      transformer: superjson,
    }),
  ],
})


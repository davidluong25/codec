/**
 * Shared configuration for the backend app
 */

const IS_DEV = process.env.NODE_ENV === "development"

/**
 * Get the API base URL
 */
export function getApiUrl(): string {
  return process.env.API_URL || "https://21st.dev"
}

/**
 * Check if running in development mode
 */
export function isDev(): boolean {
  return IS_DEV
}

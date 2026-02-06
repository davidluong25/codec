// Dev mode detection (web version)
export const IS_DEV = process.env.NODE_ENV === "development"

// Auth server port - use different port in dev to allow running alongside production
export const AUTH_SERVER_PORT = IS_DEV ? 21322 : 21321

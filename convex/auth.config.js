// const issuerURL = process.env.ISSUER_URL

/**
 * Clerk auth configuration consumed by Convex for verifying user sessions.
 * See https://docs.convex.dev/auth/clerk for linking Convex and Clerk.
 */
const convex =  {
	providers: [
			{
					domain: 'https://grateful-glowworm-20.clerk.accounts.dev', 
					applicationID: 'convex'
			}
	]
}

export default convex

/**
 * Response contracts of the /api/schedule/* Route Handlers, shared with the client hooks.
 * Types only: `import type` them so nothing is bundled.
 */

/** Error body returned by /api/schedule/* on failure. */
export interface ApiError {
	error: string
}

/** GET /api/schedule/slots */
export interface SlotsResponse {
	slots: number[]
}

/** POST /api/schedule/book (201): only what the confirmation UI renders. */
export interface BookingResponse {
	meetLink: string | null
}

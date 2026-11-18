import { buildMiamiAssets, closeMiamiAssets, releaseFade } from './miamiAssets'
import type { MiamiArt } from './miamiRuntime'
import { drawMiamiScene, drawMiamiSky } from './renderMiami'

/**
 * The landing scene's art: its bake and its draws, as the one object miamiRuntime.ts loads with import(). No other file
 * imports this one, and the worker's other files import the files only it reaches for types alone, so the bundler emits
 * the art as a chunk of its own and the worker's first download carries none of it.
 */
export const MIAMI_ART: MiamiArt = { build: buildMiamiAssets, close: closeMiamiAssets, settle: releaseFade, drawSky: drawMiamiSky, drawScene: drawMiamiScene }

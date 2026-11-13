import { buildMiamiAssets, closeMiamiAssets } from './miamiAssets'
import type { MiamiArt } from './miamiRuntime'
import { drawMiamiScene, drawMiamiSky } from './renderMiami'

/** The landing scene's art: its bake and its draws, as the one object the runtime and the sky's draws reach them through. */
export const MIAMI_ART: MiamiArt = { build: buildMiamiAssets, close: closeMiamiAssets, drawSky: drawMiamiSky, drawScene: drawMiamiScene }

/** Class strings shared by home-page sections. React-free: import by file. */

/** Body type step shared by Experience's highlights and the #ai section: 14/21px, then 16/24px from 600px. */
export const BODY_TEXT = 'text-sm leading-[1.5] min-[600px]:text-base'

/** Outer spacing and width shared by every home-page section (FadeInSection and the featured Projects section). */
export const SECTION_SHELL = 'mx-auto flex flex-col py-[60px] md:py-[80px] lg:py-[100px] lg:max-w-[1000px]'

/** Advances the section counter that prints the '0N.' before each numbered .section-header. */
export const NUMBERED_SECTION = '[counter-increment:section_1]'

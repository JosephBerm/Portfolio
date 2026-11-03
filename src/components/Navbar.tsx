'use client'

import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Logo, MenuSVG } from '@/components/icons'
import SkyPauseButton from '@/components/sky/SkyPauseButton'
import { cn, delayedReveal, duration, easing, smoothScrollTo } from '@/lib'
import { NAV_SECTIONS } from '@/lib/navigation'

/** The md breakpoint, where the nav links sit inline and the mobile menu no longer applies. */
const DESKTOP_QUERY = '(min-width: 768px)'

/** Delay between successive nav items, and then the Resume button and the sky's pause control, as they drop in (seconds). */
const NAV_STAGGER = 0.1

/** Nav entrance: drops in from -20px; each item's delay comes through Motion's `custom` prop. */
const navItemVariants = delayedReveal(-20, duration.normal)

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false)
	const [hidden, setHidden] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const burgerRef = useRef<HTMLButtonElement>(null)
	const headerRef = useRef<HTMLElement>(null)

	// Frame-batched scroll position: re-renders only when `scrolled` / `hidden` actually change
	const { scrollY } = useScroll()
	useMotionValueEvent(scrollY, 'change', (current) => {
		const previous = scrollY.getPrevious() ?? 0
		// Never hide the header while it holds keyboard focus, or the focused control would be out of sight. :focus-visible,
		// so a mouse click on a nav link (which leaves focus on it in Chrome) still lets the header hide as before
		const focused = Boolean(headerRef.current?.querySelector(':focus-visible'))
		setScrolled(current > 0)
		setHidden(current > previous && current > 0 && !focused)
	})

	// While the mobile menu is open: lock page scroll, take the dimmed page out of the tab order (inert), close on
	// Escape, and close once the viewport reaches the desktop layout, where an inert page would be unusable.
	// The cleanup also releases everything if Navbar unmounts mid-open.
	useEffect(() => {
		if (!mobileMenuOpen) return
		const content = document.getElementById('content')
		const desktop = window.matchMedia(DESKTOP_QUERY)
		const close = () => setMobileMenuOpen(false)
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return
			close()
			// The menu turns invisible, so return focus to the control that opened it
			burgerRef.current?.focus()
		}
		const onDesktop = (e: MediaQueryListEvent) => {
			if (e.matches) close()
		}

		document.body.classList.add('overflow-hidden')
		content?.setAttribute('inert', '')
		document.addEventListener('keydown', onKeyDown)
		desktop.addEventListener('change', onDesktop)
		return () => {
			document.body.classList.remove('overflow-hidden')
			content?.removeAttribute('inert')
			document.removeEventListener('keydown', onKeyDown)
			desktop.removeEventListener('change', onDesktop)
		}
	}, [mobileMenuOpen])

	const toggleMobileMenu = () => setMobileMenuOpen((open) => !open)

	const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		// Modified clicks keep native link behavior (e.g. Ctrl/Cmd+click opens /#id in a new tab)
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
		// Keep the URL clean (as before): smooth-scroll instead of a hash jump
		e.preventDefault()
		// Close the menu first: its effect cleanup lifts `inert` from #content, which focus can't enter until then
		flushSync(() => setMobileMenuOpen(false))
		smoothScrollTo(id)
	}

	return (
		<motion.header
			ref={headerRef}
			// Focus moving into a header that has slid away would land on something off screen: show it (WCAG 2.4.7, 2.4.11)
			onFocus={() => setHidden(false)}
			initial={{ y: 0 }}
			animate={{ y: hidden ? -70 : 0 }}
			transition={{ duration: 0.25, ease: easing.smooth }}
			className={cn(
				// CSS transitions only the height and shadow; Motion alone animates y, so the hide/show honors reduced motion
				'fixed top-0 z-[11] flex w-full items-center justify-between px-[25px] md:px-[40px] lg:px-[50px] backdrop-blur-[10px] transition-[height,box-shadow] duration-250',
				'bg-navy/85',
				scrolled ? 'h-[70px] shadow-[0_10px_30px_-10px_var(--color-navy-shadow)]' : 'h-[100px]'
			)}
		>
			<nav className="flex w-full items-center justify-between relative text-lightest-slate font-mono z-[12]">
				{/* Logo */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: duration.entrance }}
				>
					<Link
						href="/"
						aria-label="Home"
						className="w-[40px] block"
						onNavigate={(e) => {
							// Navbar only renders on '/', so a navigation would be a no-op: return to the top instead
							e.preventDefault()
							setMobileMenuOpen(false)
							window.scrollTo({ top: 0 })
						}}
					>
						<Logo />
					</Link>
				</motion.div>

				{/* Mobile burger */}
				<button
					ref={burgerRef}
					type="button"
					aria-label="Menu"
					aria-expanded={mobileMenuOpen}
					aria-controls="primary-nav"
					className="ml-auto cursor-pointer text-[2.5rem] z-[100] text-green w-[50px] h-[50px] flex items-center justify-center md:!hidden hover:border-[3px] hover:border-dashed hover:border-green hover:rounded-[5px]"
					onClick={toggleMobileMenu}
				>
					<MenuSVG />
				</button>

				{/* Nav links — mobile slide-in / desktop inline */}
				<div
					id="primary-nav"
					className={cn(
						'flex flex-col items-center justify-center fixed right-0 top-0 h-screen w-3/4 bg-light-navy transition-all duration-150 ease-out motion-reduce:transition-none z-[50]',
						'md:ml-auto md:flex-row md:justify-evenly md:relative md:inset-auto md:h-auto md:w-auto md:bg-transparent md:translate-x-0 md:visible',
						mobileMenuOpen ? 'translate-x-0 visible' : 'translate-x-full invisible md:visible'
					)}
				>
					<ol className="flex flex-col items-center font-normal md:flex-row">
						{NAV_SECTIONS.map((section, index) => (
							<motion.li
								key={section.id}
								variants={navItemVariants}
								custom={index * NAV_STAGGER}
								initial="hidden"
								animate="visible"
								className="relative my-[20px] text-lg md:my-0 md:ml-[8px] md:text-sm [counter-increment:item_1]"
							>
								<a
									href={`#${section.id}`}
									onClick={(e) => scrollToSection(e, section.id)}
									className="cursor-pointer text-lightest-slate transition-all duration-250 p-[10px] hover:text-green before:content-['0'counter(item)'.'] before:text-green before:mr-[5px] before:text-xs before:font-mono md:before:relative md:before:text-xxs before:absolute before:top-[-15px] before:left-1/2 before:-translate-x-1/2 md:before:top-auto md:before:left-auto md:before:translate-x-0"
								>
									{section.name}
								</a>
							</motion.li>
						))}
					</ol>
					<motion.div
						variants={navItemVariants}
						custom={NAV_SECTIONS.length * NAV_STAGGER}
						initial="hidden"
						animate="visible"
					>
						<a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="btn md:ml-[15px] text-sm">
							Resume
						</a>
					</motion.div>
				</div>

				{/* Sky pause control: last, so the tab order is the order on screen at every width */}
				<motion.div
					variants={navItemVariants}
					custom={(NAV_SECTIONS.length + 1) * NAV_STAGGER}
					initial="hidden"
					animate="visible"
					// The open phone menu's panel covers this corner, so the control leaves the tab order with it (WCAG 2.4.11)
					inert={mobileMenuOpen}
				>
					<SkyPauseButton className="ml-[10px] md:ml-[15px]" />
				</motion.div>
			</nav>
		</motion.header>
	)
}

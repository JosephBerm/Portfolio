'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Logo } from '@/components/icons'
import { router, cn, easing, duration } from '@/lib'

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false)
	const [hidden, setHidden] = useState(false)
	const [lastScrollPos, setLastScrollPos] = useState(0)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	useEffect(() => {
		const sections = [...document.querySelectorAll<HTMLElement>('.portfolio-section')]
		router.linkRoutesTo(sections)
	}, [])

	useEffect(() => {
		const handleScroll = () => {
			const currentPos = window.scrollY
			setScrolled(currentPos > 0)
			setHidden(currentPos > lastScrollPos && currentPos > 0)
			setLastScrollPos(currentPos)
		}
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [lastScrollPos])

	const toggleMobileMenu = () => {
		setMobileMenuOpen((prev) => !prev)
		document.body.classList.toggle('overflow-hidden')
	}

	const routeAndClose = (location: string) => {
		router.changeRoute(location)
		if (mobileMenuOpen) toggleMobileMenu()
	}

	const handlePDFOpen = () => {
		window.open('/resume.pdf', '_blank', 'noopener,noreferrer')
	}

	return (
		<motion.header
			initial={{ y: 0 }}
			animate={{ y: hidden ? -70 : 0 }}
			transition={{ duration: 0.25, ease: easing.smooth }}
			className={cn(
				'fixed top-0 z-[11] flex w-full items-center justify-between px-[25px] md:px-[40px] lg:px-[50px] backdrop-blur-[10px] transition-all duration-250',
				'bg-navy/85 pointer-events-auto select-auto !filter-none',
				scrolled ? 'h-[70px] shadow-[0_10px_30px_-10px_rgba(2,12,27,0.7)]' : 'h-[100px]'
			)}
		>
			<nav className="flex w-full items-center justify-between relative text-lightest-slate font-mono z-[12]">
				{/* Logo */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: duration.entrance }}
				>
					<a href="/" className="w-[40px] block">
						<Logo />
					</a>
				</motion.div>

				{/* Mobile burger */}
				<div
					className="cursor-pointer text-[2.5rem] z-[100] text-green w-[50px] h-[50px] flex items-center justify-center md:!hidden hover:border-[3px] hover:border-dashed hover:border-green hover:rounded-[5px]"
					onClick={toggleMobileMenu}
				>
					<i className="fa-solid fa-bars" />
				</div>

				{/* Nav links — mobile slide-in / desktop inline */}
				<div
					className={cn(
						'flex flex-col items-center justify-center fixed right-0 top-0 h-screen w-3/4 bg-light-navy transition-all duration-150 ease-out z-[50]',
						'md:flex-row md:justify-evenly md:relative md:inset-auto md:h-auto md:w-auto md:bg-transparent md:translate-x-0 md:visible',
						mobileMenuOpen ? 'translate-x-0 visible' : 'translate-x-full invisible md:visible'
					)}
				>
					<ol className="flex flex-col items-center list-none p-0 font-normal md:flex-row">
						{router.routes.map((route, index) => (
							<motion.li
								key={route.location}
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: duration.normal, delay: index * 0.1, ease: easing.easeOut }}
								className="relative my-[20px] text-lg md:my-0 md:ml-[8px] md:text-sm [counter-increment:item_1]"
							>
								<button
									className="cursor-pointer text-lightest-slate transition-all duration-250 p-[10px] bg-transparent border-none hover:text-green hover:bg-transparent before:content-['0'counter(item)'.'] before:text-green before:mr-[5px] before:text-xs before:font-mono md:before:relative md:before:text-xxs before:absolute before:top-[-15px] before:left-1/2 before:-translate-x-1/2 md:before:top-auto md:before:left-auto md:before:translate-x-0"
									onClick={() => routeAndClose(route.location)}
								>
									{route.name}
								</button>
							</motion.li>
						))}
					</ol>
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: duration.normal, delay: router.routes.length * 0.1, ease: easing.easeOut }}
					>
						<button className="btn md:ml-[15px] text-sm" onClick={handlePDFOpen}>
							Resume
						</button>
					</motion.div>
				</div>
			</nav>
		</motion.header>
	)
}

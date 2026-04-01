'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { variants } from '@/lib'
import { FadeInSection, RevealItem } from '@/components/motion'

export default function AboutMe() {
	return (
		<FadeInSection id="about" className="portfolio-section" isNumbered threshold={0.2} stagger={0.08}>
			<RevealItem>
				<h2 className="section-header">About Me</h2>
			</RevealItem>
			{/* motion.div passes variant propagation through to stagger children inside the grid */}
			<motion.div
				variants={{ hidden: {}, visible: {} }}
				className="flex flex-col gap-[20px] md:grid md:grid-cols-[3fr_2fr] md:gap-[50px]"
			>
				<RevealItem className="w-full lg:w-[95%]">
					<p className="mb-[15px] lg:text-justify">
						Hi, I&apos;m Joseph — a full-stack software engineer with 4+ years of professional
						experience building web applications in C#/.NET and TypeScript/React. I&apos;m the founder
						and sole developer of{' '}
						<a className="inline-link" href="https://vendorxpro.com" target="_blank" rel="noopener noreferrer">
							VendorX
						</a>
						, a multi-tenant B2B ordering platform serving real customers in production.
					</p>
					<p className="mb-[15px] lg:text-justify">
						My path into engineering started in the summer of 2013, when I met someone who showed me
						how lines of code could turn a simple idea into a working product. That moment sparked a
						curiosity that hasn&apos;t stopped — and it&apos;s the same drive behind everything I
						build today.
					</p>
					<p className="mb-[15px] lg:text-justify">
						I specialize in owning features end-to-end, from database schema design to deployment
						pipelines. Whether it&apos;s architecting tenant-isolated systems with row-level security,
						integrating third-party platforms like Stripe and QuickBooks, or building real-time
						interfaces — I thrive on solving complex problems and shipping reliable software.
					</p>
					<p className="mb-[15px] lg:text-justify">Here are a few technologies I&apos;ve been working with recently:</p>
					<ul className="sfx grid grid-cols-[repeat(2,minmax(140px,200px))] gap-x-[10px] mt-[20px]">
						{['C# / .NET 10', 'React 19', 'TypeScript', 'Next.js 16', 'PostgreSQL', 'Vue 3'].map((skill) => (
							<li key={skill} className="relative mb-[10px] pl-[20px] font-mono text-xs">
								{skill}
							</li>
						))}
					</ul>
				</RevealItem>
				<motion.div
					variants={variants.scaleReveal}
					className="relative max-w-[300px] mx-auto mt-[50px] w-[70%] md:mx-0 md:mt-0"
				>
					<div className="img-wrapper">
						<div className="photo-container">
							<Image
								src="/images/myPicture.jpg"
								alt="Professional headshot of Joseph Bermudez"
								width={300}
								height={300}
								className="rounded object-cover w-full h-auto"
								priority
							/>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</FadeInSection>
	)
}

'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { cn, variants } from '@/lib'
import type { FeaturedProjectImageDetailsType } from '@/lib/portfolioInformation'

interface IProjectImageProps {
	imageDetails: FeaturedProjectImageDetailsType
	isOdd: boolean
}

export default function ProjectImage({ imageDetails, isOdd }: IProjectImageProps) {
	const { link, imgSrc, imgAlt } = imageDetails

	// Image slides in from its side — opposite direction to the text.
	const slideVariants = isOdd ? variants.slideFromLeft : variants.slideFromRight

	return (
		<motion.div
			variants={slideVariants}
			className={cn(
				'project-image-wrapper row-[1/-1]',
				isOdd ? 'md:col-[1/8]' : 'md:col-[6/-1]'
			)}
		>
			<a href={link} rel="noopener noreferrer" target="_blank">
				<div className="image-inner">
					{/* The card spans at most 7/12 of the 1000px section (about 580px). */}
					<Image
						src={imgSrc}
						alt={imgAlt}
						fill
						className="object-cover"
						sizes="(min-width: 1024px) 580px, (min-width: 768px) 50vw, 100vw"
					/>
				</div>
			</a>
		</motion.div>
	)
}

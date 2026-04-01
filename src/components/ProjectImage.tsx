'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { cn, variants } from '@/lib'
import type { FeaturedProjectImageDetailsType } from '@/lib'

interface IProjectImageProps {
	imageDetails: FeaturedProjectImageDetailsType
	isOdd: boolean
}

export default function ProjectImage({ imageDetails, isOdd }: IProjectImageProps) {
	const { link, imgUrl, imgAlt } = imageDetails

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
					<Image
						src={imgUrl}
						alt={imgAlt}
						fill
						className="object-cover"
						sizes="(min-width: 700px) 700px, 100vw"
					/>
				</div>
			</a>
		</motion.div>
	)
}

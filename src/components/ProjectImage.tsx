import React from 'react'
import { FeaturedProjectImageDetailsType } from '@/services/portfolioInformation'

interface IProjectImageProps {
	imageDetails: FeaturedProjectImageDetailsType
}

function ProjectImage({ imageDetails }: IProjectImageProps) {
	const { link, imgUrl, imgAlt } = imageDetails

	return (
		<div className='project-image'>
			<a
				href={link}
				rel='noopener noreferrer'
				target='_blank'>
				<div className='image-wrapper'>
					<div style={{ maxWidth: '700px', display: 'block' }}>
						<img
							src="data:image/svg+xml;charset=utf-8,%3Csvg height='438' width='700' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3C/svg%3E"
							alt=''
							role='presentation'
							style={{ maxWidth: '100%', display: 'block', position: 'static' }}
						/>
					</div>
					<img
						aria-hidden='true'
						data-placeholder-image
						decoding='async'
						alt=''
						src={imgUrl}
						style={{
							opacity: 0,
							transition: 'opacity 500ms linear 0s',
							objectFit: 'cover',
						}}
					/>
					<picture>
						<img
							src={imgUrl}
							alt={imgAlt}
							sizes='(min-width: 700px) 700px, 100vw'
							data-main-image
							style={{ objectFit: 'cover', opacity: 1 }}
						/>
					</picture>
				</div>
			</a>
		</div>
	)
}

export default ProjectImage

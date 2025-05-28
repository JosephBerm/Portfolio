import React, { useEffect } from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'
import FeaturedProject from '@/components/FeaturedProject'
import ProjectImage from '@/components/ProjectImage'
import observe from '@/services/elementObserver'

const Projects: React.FC = () => {
	const { featuredProjects } = usePortfolioStore()

	useEffect(() => {
		const listItems = [...document.querySelectorAll('.projects-list-item')]
		const thresholdMap = {
			project: 0.5,
		}
		observe(listItems, thresholdMap)
	}, [])

	return (
		<section id='projects' className='section projects_section isNumbered'>
			<h2 className='section-header'>Projects I Keep Up With</h2>
			<div className='section-body'>
				<ul className='projects-list'>
					{featuredProjects.map((project, index) => (
						<li className='projects-list-item' style={{ ['--index' as string]: index }} key={index} id='project'>
							<FeaturedProject projectDetails={project.info} />
							<ProjectImage imageDetails={project.imageDetails} />
						</li>
					))}
				</ul>
			</div>
		</section>
	)
}

export default Projects

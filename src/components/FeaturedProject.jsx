import React from "react";

function FeaturedProject({ projectDetails }) {
	return (
		<div className='project-content'>
			<p className='project-overline'>Featured Project</p>
			<h3 className='project-title'>
				<a
					href={projectDetails.projectLink}
					target='_blank'
					rel='noopener noreferrer'>
					{projectDetails.title}
				</a>
			</h3>
			<div className='project-description'>
				<p>
					{projectDetails.description}
					<a
						href={projectDetails.githubLink}
						target='_blank'
						rel='noopener noreferrer'>
						Example Link
					</a>
					,
					<a
						href={projectDetails.githubLink}
						target='_blank'
						rel='noopener noreferrer'>
						Link 2 Example
					</a>
					,
					<a
						href={projectDetails.githubLink}
						target='_blank'
						rel='noopener noreferrer'>
						Another Example
					</a>
					, and
					<a
						href={projectDetails.githubLink}
						target='_blank'
						rel='noopener noreferrer'>
						Last One
					</a>
					.
				</p>
			</div>
			<ul className='project-tech-list'>
				{projectDetails.technologiesUsed.map((tech, index) => (
					<li key={index}>{tech}</li>
				))}
			</ul>
			<div className='project-links'>
				<a
					href={projectDetails.githubLink}
					target='_blank'
					rel='noopener noreferrer'>
					💫
				</a>
				<a
					href={projectDetails.projectLink}
					target='_blank'
					rel='noopener noreferrer'>
					💢
				</a>
			</div>
		</div>
	);
}

export default FeaturedProject;

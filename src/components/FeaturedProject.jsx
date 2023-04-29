import React from "react";

function FeaturedProject({ projectDetails }) {
	function getTextWithLinks() {
		let desc = projectDetails.description;
		let descLinks = projectDetails.descriptionLinks;

		for (let key in descLinks) {
			const { text, link } = descLinks[key];
			const regex = new RegExp(text, "g");
			desc = desc.replace(
				regex,
				`<a
					href=${link} 
					target="_blank"
					rel='noopener noreferrer'
					>
					${text}
				</a>`
			);
		}

		return <p dangerouslySetInnerHTML={{ __html: desc }} />;
	}

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
			<div className='project-description'>{getTextWithLinks()}</div>
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

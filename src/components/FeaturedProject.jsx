import React from "react";
import { getTextWithLinks } from "../services/utils";

function FeaturedProject({ projectDetails }) {
	const {
		projectLink,
		title,
		technologiesUsed,
		githubLink,
		description,
		descriptionLinks,
	} = projectDetails;

	return (
		<div className='project-content'>
			<p className='project-overline'>Featured Project</p>
			<h3 className='project-title'>
				<a href={projectLink} target='_blank' rel='noopener noreferrer'>
					{title}
				</a>
			</h3>
			<div className='project-description'>
				{getTextWithLinks(description, descriptionLinks)}
			</div>
			<ul className='project-tech-list'>
				{technologiesUsed.map((tech, index) => (
					<li key={index}>{tech}</li>
				))}
			</ul>
			<div className='project-links'>
				<a href={githubLink} target='_blank' rel='noopener noreferrer'>
					💫
				</a>
				<a href={projectLink} target='_blank' rel='noopener noreferrer'>
					💢
				</a>
			</div>
		</div>
	);
}

export default FeaturedProject;

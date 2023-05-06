import React, { useEffect, useContext } from "react";
import UserContext from "../context/portfolioContext";
import observe from "../services/elementObserver";
import Card from "./Card";

function OtherProjects({ OtherProjectsRef }) {
	const { otherProjects: projList } = useContext(UserContext);

	useEffect(() => {
		const listItems = [...document.querySelectorAll(".other-projects-list-item")];
		const thresholdMap = {
			project: 0.5,
		};
		observe(listItems, thresholdMap);
	}, []);
	return (
		<section
			ref={OtherProjectsRef}
			id='other-projects'
			className='section other-projects_section'>
			<h2>Other Noteworthy Projects</h2>
			<a
				className='inline-link archive-link'
				href='http://localhost:3000/'
				target='_blank'
				rel='noopener noreferrer'>
				view the archive
			</a>
			<ul className='projects-grid'>
				{projList.map((proj, index) => (
					<li
						className='other-projects-list-item'
						style={{ "--delay": index % 3 }}
						key={index}
						id='project'>
						<Card>
							<header>
								<div className='project-top'>
									<div className='folder'>folderSVG</div>
									<div className='project-links'>
										{proj.githubLink.length !== 0 && (
											<a
												href={proj.githubLink}
												className='external'
												rel='noopener noreferrer'
												aria-label='External Link'
												target='_blank'>
												Git
											</a>
										)}
										{proj.projectLink.length !== 0 && (
											<a
												href={proj.projectLink}
												className='external'
												rel='noopener noreferrer'
												aria-label='External Link'
												target='_blank'>
												link
											</a>
										)}
									</div>
								</div>
								<h3 className='project-title'>
									<a
										href={proj.projectLink}
										target='_blank'
										rel='noopener noreferrer'>
										{proj.title}
									</a>
								</h3>
								<div className='project-description'>
									<p>{proj.description}</p>
								</div>
							</header>
							<footer>
								<ul className='project-tech-list'>
									{proj.technologiesUsed.map((tech, index) => (
										<li key={index}>{tech}</li>
									))}
								</ul>
							</footer>
						</Card>
					</li>
				))}
			</ul>
			<button className='more-button'>Show More</button>
		</section>
	);
}

export default OtherProjects;

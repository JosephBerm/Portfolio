import React, { useContext, useEffect } from "react";
import UserContext from "../context/portfolioContext";
import FeaturedProject from "./FeaturedProject";
import ProjectImage from "./ProjectImage";
import observeElem from "../services/elementObserver";

function Projects({ projectsRef }) {
	const { featuredProjects } = useContext(UserContext);

	useEffect(() => {
		const listItems = [...document.querySelectorAll(".projects-list-item")];
		observeElem(listItems);
	}, []);

	return (
		<section
			ref={projectsRef}
			id='projects'
			className='section projects_section isNumbered'>
			<h2 className='section-header'>Some Things I've Built</h2>
			<div className='section-body'>
				<ul className='projects-list'>
					{featuredProjects.map((project, index) => (
						<li
							className='projects-list-item'
							style={{ "--index": index }}
							key={index}>
							<FeaturedProject projectDetails={project.info} />
							<ProjectImage imageDetails={project.imageDetails} />
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

export default Projects;

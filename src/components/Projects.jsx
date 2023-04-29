import React, { useContext } from "react";
import UserContext from "../context/portfolioContext";
import FeaturedProject from "./FeaturedProject";
import ProjectImage from "./ProjectImage";

function Projects({ projectsRef }) {
	const { projects } = useContext(UserContext);

	return (
		<section ref={projectsRef} id='projects' className='section projects_section'>
			<h2 className='section-header'>Some Things I've Built</h2>
			<div className='section-body'>
				<ul className='projects-list'>
					{projects.map((project, index) => (
						<li style={{ "--index": index }} key={index}>
							<FeaturedProject projectDetails={project.info} />
							<ProjectImage imageDetails={project.imageDetails} index={index} />
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

export default Projects;

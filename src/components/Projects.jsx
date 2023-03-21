import React from "react";

function Projects({ projectsRef }) {
	return (
		<section ref={projectsRef} id='projects' className='projects_section'>
			<h2 className='section-header'>Some Things I've Built</h2>
			<div className='section-body'>
				<ul className='projects-list'>
					<li>Card 1</li>
					<li>Card 2</li>
					<li>Card 3</li>
				</ul>
				<h3>Other Noteworthy Projects</h3>
				<p>view the archive</p>
				<ul className='projects-grid'>
					<li>1</li>
					<li>2</li>
					<li>3</li>
					<li>4</li>
					<li>5</li>
					<li>6</li>
				</ul>
				<button>Show More</button>
			</div>
		</section>
	);
}

export default Projects;

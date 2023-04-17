import React from "react";
import Card from "./Card";

function Projects({ projectsRef }) {
	return (
		<section ref={projectsRef} id='projects' className='section projects_section'>
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
					<li>
						<Card>Card 1</Card>
					</li>
					<li>
						<Card>Card 2</Card>
					</li>
					<li>
						<Card>Card 3</Card>
					</li>
					<li>
						<Card>Card 4</Card>
					</li>
					<li>
						<Card>Card 5</Card>
					</li>
					<li>
						<Card>Card 6</Card>
					</li>
				</ul>
				<button>Show More</button>
			</div>
		</section>
	);
}

export default Projects;

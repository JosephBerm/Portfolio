import React from "react";
import Card from "./Card";

function OtherProjects({ OtherProjectsRef }) {
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
		</section>
	);
}

export default OtherProjects;

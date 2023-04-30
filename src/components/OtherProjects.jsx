import React, { useEffect, useContext } from "react";
import UserContext from "../context/portfolioContext";
import observeElem from "../services/elementObserver";
import Card from "./Card";

function OtherProjects({ OtherProjectsRef }) {
	const { otherProjects: projList } = useContext(UserContext);

	useEffect(() => {
		const listItems = [...document.querySelectorAll(".other-projects-list-item")];
		observeElem(listItems);
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
					<li className='other-projects-list-item' style={{ "--delay": index }}>
						<Card>{proj.title}</Card>
					</li>
				))}
			</ul>
			<button>Show More</button>
		</section>
	);
}

export default OtherProjects;

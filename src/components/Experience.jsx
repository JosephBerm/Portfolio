import React, { useContext } from "react";
import UserContext from "../context/portfolioContext";

function Experience({ jobsRef }) {
	const { workExperience } = useContext(UserContext);
	return (
		<section ref={jobsRef} id='jobs' className='jobs_section'>
			<h2 className='section-header'>Where I've Worked</h2>
			<div className='section-body'>
				<div className='tab-menu'>
					<div className='timeline'>
						<div className='selected-timeline' />
					</div>
					<ol>
						{workExperience.map((wE, index) => (
							<li className='tabmenu-item' key={index}>
								{wE.companyName}
							</li>
						))}
					</ol>
					<div className='work-summary'>
						<div className='title'>selected.titleOfPosition</div>
						<div className='timeline'>selected.timeline</div>
						<div className='highlights'>selected.highlights.map(()) </div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Experience;

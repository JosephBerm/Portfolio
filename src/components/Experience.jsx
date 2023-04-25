import React, { useContext, useState } from "react";
import UserContext from "../context/portfolioContext";

function Experience({ jobsRef }) {
	const { workExperience } = useContext(UserContext);
	const [selectedWork, setSelectedWork] = useState(workExperience[0]);

	const handleJobSelection = (wE) => {
		setSelectedWork(wE);
	};
	const buttonClass = (wE) => {
		let className = "tabList-item";

		if (wE === selectedWork) className += " selected";

		return className;
	};
	return (
		<section ref={jobsRef} id='jobs' className='section jobs_section'>
			<h2 className='section-header'>Where I've Worked</h2>
			<div className='section-body'>
				<div className='tabList'>
					{workExperience.map((wE, index) => (
						<button
							className={buttonClass(wE)}
							key={index}
							onClick={() => handleJobSelection(wE)}>
							<span>{wE.companyName}</span>
						</button>
					))}
					<div className='higlighted-job' />
				</div>
				<div className='work-summary'>
					<div className='title'>{selectedWork.titleOfPosition}</div>
					<div className='timeline'>{selectedWork.timeline}</div>
					<div className='highlights'>
						<ul>
							{selectedWork.highlights.map((hl) => (
								<li>{hl}</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Experience;

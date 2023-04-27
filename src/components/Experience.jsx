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
	const getSelectedIndex = () => {
		return workExperience.findIndex((wE) => wE === selectedWork);
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
					<div
						className='highlighted-job'
						style={{ "--index": getSelectedIndex() }}
					/>
				</div>
				<div className='work-summary'>
					<h3 className='position'>
						<span>{selectedWork.titleOfPosition}</span>
						<span className='company'>
							&nbsp;@&nbsp;
							<a
								className='inline-link'
								href={selectedWork.link}
								target='_blank'
								rel='noopener noreferrer'>
								{selectedWork.companyName}
							</a>
						</span>
					</h3>
					<p className='timeline'>{selectedWork.timeline}</p>
					<div className='highlights'>
						<ul className='experienceList'>
							{selectedWork.highlights.map((hl, index) => (
								<li key={index}>{hl}</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Experience;

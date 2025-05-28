import React, { useContext, useState } from "react";
import { usePortfolioStore } from '@/store/portfolioStore'
import { IWorkExperience } from '@/services/portfolioInformation'

const Experience: React.FC<{ jobsRef: React.RefObject<HTMLElement | null> }> = ({ jobsRef }) => {
	const { workExperience } = usePortfolioStore()
	const [selectedWork, setSelectedWork] = useState(workExperience[0]);

	const handleJobSelection = (wE: IWorkExperience) => {
		setSelectedWork(wE);
	};
	const buttonClass = (wE: IWorkExperience) => {
		let className = "tabList-item";

		if (wE === selectedWork) className += " selected";

		return className;
	};
	const getSelectedIndex = () => {
		return workExperience.findIndex((wE) => wE === selectedWork);
	};
	return (
		<section ref={jobsRef} id='jobs' className='section jobs_section isNumbered'>
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
						style={{ ['--index' as string]: getSelectedIndex() }}
					/>
				</div>
				<div className='work-summary fadeIn' key={getSelectedIndex()}>
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
						<ul className='experienceList sfx'>
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

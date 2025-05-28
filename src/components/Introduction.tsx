import React, { useEffect, useState } from "react";
import { usePortfolioStore } from "@/store/portfolioStore";

const Introduction: React.FC = () => {
	const { userProfile } = usePortfolioStore();
	const [animatedClassName, setAnimatedClassName] = useState(" fadeup-enter");

	useEffect(() => {
		setTimeout(() => {
			setAnimatedClassName(" fadeup-enter active");
		}, 1000);
	}, []);

	return (
		<section className='hero_section'>
			<div className={"greeting" + animatedClassName} style={{ ['--index' as string]: 1 }}>
				<h1>Hi, my name is</h1>
			</div>
			<div className={"name" + animatedClassName} style={{ ['--index' as string]: 2 }}>
				<h2 className='big-heading'>{userProfile.name}.</h2>
			</div>
			<div className={"myJob" + animatedClassName} style={{ ['--index' as string]: 3 }}>
				<h3 className='big-heading'>I build things for the web.</h3>
			</div>
			<div className={"objective" + animatedClassName} style={{ ['--index' as string]: 4 }}>
				<p>{userProfile.objective}</p>
			</div>
			<div className={"contactMe" + animatedClassName} style={{ ['--index' as string]: 5 }}>
				<a
					className='button contact-button'
					href={`mailTo:${userProfile.email}`}
					target='_blank'
					rel='noopener noreferrer'>
					Contact Me
				</a>
			</div>
		</section>
	);
}

export default Introduction;

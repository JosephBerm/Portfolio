import React, { useContext, useEffect, useState } from "react";
import UserContext from "../context/portfolioContext";

function Introduction(props) {
	const { userProfile } = useContext(UserContext);
	const [animatedClassName, setAnimatedClassName] = useState(" fadeup-enter");

	useEffect(() => {
		setTimeout(() => {
			setAnimatedClassName(" fadeup-enter active");
		}, 650);
	}, []);

	return (
		<section className='hero_section'>
			<div className={"greeting" + animatedClassName} style={{ "--index": 1 }}>
				<h1>Hi, my name is</h1>
			</div>
			<div className={"name" + animatedClassName} style={{ "--index": 2 }}>
				<h2 className='big-heading'>{userProfile.name}.</h2>
			</div>
			<div className={"myJob" + animatedClassName} style={{ "--index": 3 }}>
				<h3 className='big-heading'>I build things for the web.</h3>
			</div>
			<div className={"objective" + animatedClassName} style={{ "--index": 4 }}>
				<p>{userProfile.objective}</p>
			</div>
			<div className={"contactMe" + animatedClassName} style={{ "--index": 5 }}>
				<button className='contact-button'>Contact Me</button>
			</div>
		</section>
	);
}

export default Introduction;

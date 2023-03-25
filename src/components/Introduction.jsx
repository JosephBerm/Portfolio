import React, { useContext } from "react";
import UserContext from "../context/portfolioContext";

function Introduction(props) {
	const { userProfile } = useContext(UserContext);
	return (
		<section className='hero_section'>
			<div className='intro'>
				<h1>Hi, my name is</h1>
				<h2 className='big-heading'>{userProfile.name}.</h2>
				<h3 className='big-heading'>I build things for the web.</h3>
				<p>{userProfile.objective}</p>
				<button className='contact-button'>Contact Me</button>
			</div>
		</section>
	);
}

export default Introduction;

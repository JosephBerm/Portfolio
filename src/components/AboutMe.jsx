import React from "react";
import myPicture from "../assets/myPicture.jpg";

function AboutMe({ aboutRef }) {
	// useEffect(() =>
	// {
	// }, []);
	return (
		<section ref={aboutRef} id='about' className='section about_section isNumbered'>
			<h2 className='section-header'>About Me</h2>
			<div className='section-body'>
				<div className='text-container'>
					<p>
						Hello! My name is Joseph and I am passionate about the Internet of
						Things. My journey towards becoming a software engineer had its inception
						during the summer of 2013 when I worked alongside my father in
						maintenance at an office building. Fate had it that I would meet a man
						who would transform my life forever.
					</p>
					<p>
						It was during this time that I witnessed the awe-inspiring process of
						bringing a concept to life right before my very eyes. Watching the man
						take gibberish and seamlessly transform it into a tangible product left
						me spellbound. This encounter ignited a spark of curiosity and creativity
						in me that has guided my professional journey ever since.
					</p>
					<p>
						As of today, I strive to capture the magical essence that arises from
						creating something from scratch and observing it seamlessly function. My
						ultimate goal is to remain at the vanguard of state-of-the-art technology
						and to provide an unparalleled digital experience that can revolutionize
						the world.
					</p>
					<p>Here are a few technologies I've been working with recently:</p>
					<ul className='skills_list sfx'>
						<li>JavaScript (ES6+)</li>
						<li>Node.js</li>
						<li>React</li>
						<li>.NET Core</li>
						<li>TypeScript</li>
						<li>Vue.js</li>
					</ul>
				</div>
				<div className='enclosed'>
					<div className='img-wrapper'>
						<picture className='photo-container'>
							<img
								src={myPicture}
								alt='Professional headshot of Joseph Bermudez'
								style={{ maxWidth: "100%", display: "block", position: "static" }}
							/>
						</picture>
					</div>
				</div>
			</div>
		</section>
	);
}

export default AboutMe;

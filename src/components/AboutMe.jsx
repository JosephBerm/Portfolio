import React from "react";
import samplePicture from "../assets/sample-picture.jpg";

function AboutMe({ aboutRef }) {
	// useEffect(() =>
	// {
	// }, []);
	return (
		<section ref={aboutRef} id='about' className='section about_section'>
			<h2 className='section-header'>About Me</h2>
			<div className='section-body'>
				<div className='text-container'>
					<p>
						Hello! My name is Joseph, and I am passionate about the internet of
						things. My journey to becoming a software engineer began in the summer of
						2013, during which I worked with my father in maintenance at an office
						building. It was there that I met a man who would go on to change my
						life.
					</p>
					<p>
						For the first time ever, I witnessed a concept come to life before my
						eyes. I was amazed as I watched the man input gibberish on the screen and
						transform it into a tangible product. That experience ignited a spark
						within me that would propel me towards my current profession.
					</p>
					<p>
						Today, I continue to pursue that magical feeling that comes with creating
						something from scratch and seeing it function as intended. My primary
						objective is to be at the forefront of cutting-edge technology and
						provide a unique digital experience that can change the world.
					</p>
					<p>Here are a few technologies I've been working with recently:</p>
					<ul className='skills_list'>
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
								src={samplePicture}
								alt='Professional headshot of Joseph Bermudez'
								style={{ maxWidth: "100%", display: "block", position: "static" }}
							/>
						</picture>
						<div className='background-border' />
					</div>
				</div>
			</div>
		</section>
	);
}

export default AboutMe;

import React from 'react'
import myPicture from '@/assets/myPicture.jpg'

interface IAboutMeProps {
	aboutRef: React.RefObject<HTMLElement | null>
}

const AboutMe: React.FC<IAboutMeProps> = ({ aboutRef }) => {
	return (
		<section
			ref={aboutRef}
			id='about'
			className='section about_section isNumbered'>
			<h2 className='section-header'>About Me</h2>
			<div className='section-body'>
				<div className='text-container'>
					<p>
						Hi, I&apos;m Joseph, and I&apos;m passionate about the Internet of Things. My path to becoming a
						software engineer began in the summer of 2013, when I worked alongside my father doing
						maintenance at an office building. It was there that I met someone who completely changed how I
						saw the world.
					</p>
					<p>
						During our conversations, I saw firsthand how an idea could evolve from a simple concept into
						something tangible and impactful. Watching him turn lines of code into a working product sparked
						my curiosity and creativity—it was the moment I realized the power of technology to bring ideas
						to life.
					</p>
					<p>
						Today, I&apos;m driven by that same curiosity. I aim to build solutions from the ground up,
						combining innovation with functionality to make a meaningful impact. My goal is to stay at the
						forefront of cutting-edge technology and contribute to creating digital experiences that truly
						make a difference.
					</p>
					<p>Here are a few technologies I&apos;ve been working with recently:</p>
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
								style={{ maxWidth: '100%', display: 'block', position: 'static' }}
							/>
						</picture>
					</div>
				</div>
			</div>
		</section>
	)
}

export default AboutMe

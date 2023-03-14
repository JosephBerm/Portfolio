import React, { useState, useEffect, useRef } from "react";
import LoadingLogo from "./components/LoadingLogo";
import Navbar from "./components/Navbar";
import router from "./services/router";
import "../src/css/App.css";

function App() {
	const [isLoading, setIsLoading] = useState(true);
	const appRef = useRef(null);
	const aboutRef = useRef(null);
	const jobsRef = useRef(null);
	const projectsRef = useRef(null);
	const contactRef = useRef(null);

	useEffect(() => {
		setTimeout(() => {
			setIsLoading(false);
		}, 3100);

		const sections = {
			about: aboutRef,
			jobs: jobsRef,
			projects: projectsRef,
			contact: contactRef,
		};
		router.linkRoutesTo(sections);
	}, [isLoading]);

	if (isLoading) {
		return (
			<div className='fill-page page-loader'>
				<LoadingLogo />
			</div>
		);
	}
	return (
		<div className='App' ref={appRef}>
			{appRef && <Navbar scrolledRef={appRef} />}
			<div id='content'>
				<section className='hero_section'>
					<div className='large-box'>Hello World</div>
				</section>
				<section ref={aboutRef} id='about' className='about_section'>
					<div className='large-box'>About</div>
					<p>This is just a test!!</p>
				</section>
				<section ref={jobsRef} id='jobs' className='jobs_section'>
					<div className='large-box'>Jobs</div>
				</section>
				<section ref={projectsRef} id='projects' className='projects_section'>
					<div className='large-box'>Projects</div>
				</section>
				<section ref={contactRef} id='contact' className='contact_section'>
					<div className='large-box'>Contact</div>
				</section>
			</div>
		</div>
	);
}

export default App;

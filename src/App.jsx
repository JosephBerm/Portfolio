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
					<div className='intro'>
						<h1>Hi, my name is</h1>
						<h2>Joseph Bermudez.</h2>
						<h3>I build things for the web</h3>
						<p>
							Lorem ipsum dolor, sit amet consectetur adipisicing elit. Modi alias,
							qui eius neque obcaecati exercitationem officiis, adipisci omnis ullam
							libero maxime sed quidem blanditiis, deleniti doloremque eveniet. Nemo
							doloribus ex sapiente. Libero eos eius quisquam. Veritatis iste error,
							amet nam magnam vero tenetur repellat at, quam alias dolor iusto.
						</p>
						<button>Contact Me</button>
					</div>
				</section>
				<section ref={aboutRef} id='about' className='about_section'>
					<h2 className='section-header'>About Me</h2>
				</section>
				<section ref={jobsRef} id='jobs' className='jobs_section'>
					<h2 className='section-header'>Where I've Worked</h2>
				</section>
				<section ref={projectsRef} id='projects' className='projects_section'>
					<h2 className='section-header'>Some Things I've Built</h2>
				</section>
				<section ref={contactRef} id='contact' className='contact_section'>
					<h2 className='section-header'>Contact Me</h2>
				</section>
			</div>
		</div>
	);
}

export default App;

import React, { useState, useEffect, useRef } from "react";
import LoadingLogo from "./components/LoadingLogo";
import Navbar from "./components/Navbar";
import router from "./services/router";
import Introduction from "./components/Introduction";
import AboutMe from "./components/AboutMe";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import ContactMe from "./components/ContactMe";
import PortfolioContext from "./context/portfolioContext";
import myPortfolio from "./services/portfolioInformation";
import "../src/css/App.css";

function App() {
	const [isLoading, setIsLoading] = useState(true);
	const appRef = useRef(null);
	const aboutRef = useRef(null);
	const jobsRef = useRef(null);
	const projectsRef = useRef(null);
	const contactRef = useRef(null);

	useEffect(() => {
		if (isLoading) {
			setTimeout(() => {
				setIsLoading(false);
			}, 3100);
			return;
		}
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
			<PortfolioContext.Provider value={{ ...myPortfolio }}>
				{appRef && <Navbar scrolledRef={appRef} />}
				<div id='content'>
					<main className='fillHeight'>
						<Introduction />
						<AboutMe aboutRef={aboutRef} />
						<Experience jobsRef={jobsRef} />
						<Projects projectsRef={projectsRef} />
						<ContactMe contactRef={contactRef} />
					</main>
				</div>
			</PortfolioContext.Provider>
		</div>
	);
}

export default App;

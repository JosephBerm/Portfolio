import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import router from "./services/router";
import Introduction from "./components/Introduction";
import AboutMe from "./components/AboutMe";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import ContactMe from "./components/ContactMe";
import PortfolioContext from "./context/portfolioContext";
import myPortfolio from "./services/portfolioInformation";
import ScrollService from "./services/scrollAnimationService";
import LoadingPage from "./components/LoadingPage";
import "../src/css/App.css";

function App() {
	const [scrollService, setScrollService] = useState(null);
	const aboutRef = useRef(null);
	const jobsRef = useRef(null);
	const projectsRef = useRef(null);
	const contactRef = useRef(null);

	useEffect(() => {
		// const sections = {
		// 	about: aboutRef,
		// 	jobs: jobsRef,
		// 	projects: projectsRef,
		// 	contact: contactRef,
		// };
		// router.linkRoutesTo(sections);
		// const scrollable = new ScrollService([
		// 	aboutRef,
		// 	jobsRef,
		// 	projectsRef,
		// 	contactRef,
		// ]);
		// setScrollService(scrollable);
		console.log("inner log");
	}, []);

	console.log("outer log");

	return (
		<div className='App'>
			<PortfolioContext.Provider value={{ ...myPortfolio }}>
				<LoadingPage />
				<Navbar scrollable={scrollService} />
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

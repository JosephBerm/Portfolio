import "../src/css/App.css";
import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Introduction from "./components/Introduction";
import AboutMe from "./components/AboutMe";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import ContactMe from "./components/ContactMe";
import PortfolioContext from "./context/portfolioContext";
import myPortfolio from "./services/portfolioInformation";
import LoadingPage from "./components/LoadingPage";
import Background from "./components/Background";
import OtherProjects from "./components/OtherProjects";
import AppFooter from "./components/AppFooter";
import LeftSidePane from "./components/LeftSidePane";
import RightSidePane from "./components/RightSidePane";

function App() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setTimeout(() => {
			setIsLoading(false);
		}, 3100);
	}, []);

	if (isLoading) return <LoadingPage />;

	return (
		<div className='App'>
			<PortfolioContext.Provider value={{ ...myPortfolio }}>
				<Background />
				<Navbar />
				<LeftSidePane />
				<RightSidePane />
				<div id='content'>
					<main className='fillHeight'>
						<Introduction />
						<AboutMe />
						<Experience />
						<Projects />
						<OtherProjects />
						<ContactMe />
					</main>
					<AppFooter />
				</div>
			</PortfolioContext.Provider>
		</div>
	);
}

export default App;

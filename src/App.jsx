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
import "../src/css/App.css";

function App() {
	console.log("rendered app");
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		setTimeout(() => {
			setIsLoading(false);
		}, 3100);
	});
	if (isLoading) return <LoadingPage />;
	return (
		<div className='App'>
			<div id='stars'></div>
			<div id='stars2'></div>
			<PortfolioContext.Provider value={{ ...myPortfolio }}>
				<Navbar />
				<div id='content'>
					<main className='fillHeight'>
						<Introduction />
						<AboutMe />
						<Experience />
						<Projects />
						<ContactMe />
					</main>
				</div>
			</PortfolioContext.Provider>
		</div>
	);
}

export default App;

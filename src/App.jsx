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
import Background from "./components/Background";

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

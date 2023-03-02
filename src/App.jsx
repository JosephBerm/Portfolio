import React, { useState, useEffect } from "react";
import LoadingLogo from "./components/LoadingLogo";
import Navbar from "./components/Navbar";
import "../src/css/App.css";

function App() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setTimeout(() => {
			setIsLoading(false);
		}, 3100);
	}, [isLoading]);

	if (isLoading) {
		return (
			<div className='fill-page page-loader'>
				<LoadingLogo />
			</div>
		);
	}
	return (
		<div className='App'>
			<Navbar />
			<div className='large-box' />
		</div>
	);
}

export default App;

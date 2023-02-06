import React, { useState, useEffect } from "react";
import "../src/css/App.css";
import LoadingComponent from "./components/LoadingComponent";
import Navbar from "./components/Navbar";

function App() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setTimeout(() => {
			setIsLoading(false);
		}, 3350);
	}, []);
	return (
		<div className='App'>
			{isLoading && (
				<div className='fill-page'>
					<LoadingComponent />
				</div>
			)}
			<Navbar />
		</div>
	);
}

export default App;

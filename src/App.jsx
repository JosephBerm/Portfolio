import React, { useState, useEffect, useRef } from "react";
import LoadingLogo from "./components/LoadingLogo";
import Navbar from "./components/Navbar";
import "../src/css/App.css";

function App() {
	const [isLoading, setIsLoading] = useState(true);
	const appRef = useRef(null);

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
		<div className='App' ref={appRef}>
			{appRef && <Navbar scrolledRef={appRef} />}
			<div id='content'>
				<div className='large-box'>Hello World</div>
			</div>
		</div>
	);
}

export default App;

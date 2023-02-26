import React, { useState, useEffect } from "react";
import LoadingLogo from "./components/LoadingLogo";
import Navbar from "./components/Navbar";
import "../src/css/App.css";

function App() {
	return (
		<div className='App'>
			<div className='fill-page page-loader'>
				<LoadingLogo />
			</div>
			<Navbar />
		</div>
	);
}

export default App;

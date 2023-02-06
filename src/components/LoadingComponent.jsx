import React, { useEffect } from "react";
import LoadingLogo from "../assets/LoadingLogo";

function LoadingComponent(props) {
	useEffect(() => {}, []);
	return (
		<div className='loading-logo'>
			<LoadingLogo />
		</div>
	);
}

export default LoadingComponent;

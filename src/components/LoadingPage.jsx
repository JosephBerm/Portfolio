import React, { useEffect, useState } from "react";
import LoadingLogo from "./LoadingLogo";

function LoadingPage(props) {
	const [componentClassName, setComponentClassName] = useState("");

	useEffect(() => {
		setTimeout(() => {
			setComponentClassName(" hidden");
		}, 3100);
	}, []);
	return (
		<div className={`fill-page page-loader${componentClassName}`}>
			<LoadingLogo />
		</div>
	);
}

export default LoadingPage;

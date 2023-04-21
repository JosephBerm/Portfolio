import React, { useEffect, useState } from "react";

function Background(props) {
	const [gravity, setGravity] = useState(false);
	useEffect(() => {
		const interval = setInterval(() => {
			setGravity((prevGravity) => !prevGravity);
		}, 50000);
		return () => clearInterval(interval);
	}, []);
	return (
		<div id='galaxy-bg' className={gravity ? "gravity" : ""}>
			<div id='stars' />
			<div id='stars2' />
			<div id='stars3' />
			<div className='shooting-stars' />
		</div>
	);
}

export default Background;

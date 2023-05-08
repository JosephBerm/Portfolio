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
			<div id='stars4' />
			<div id='stars5' />
			<div id='stars6' />
			{gravity ? (
				<div className='shooting-stars south'>
					<div className='head' />
				</div>
			) : (
				<div className='shooting-stars north'>
					<div className='head' />
				</div>
			)}
		</div>
	);
}

export default Background;

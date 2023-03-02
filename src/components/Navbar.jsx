import React, { useState, useEffect } from "react";
import Logo from "../assets/Logo";

function Navbar(props) {
	const routes = [
		{
			name: "About",
			location: "about",
		},
		{
			name: "Experience",
			location: "jobs",
		},
		{
			name: "Work",
			location: "projects",
		},
		{
			name: "Contact",
			location: "contact",
		},
	];

	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		let prevScrollPos = window.pageYOffset;
		const handleScroll = () => {
			const currentScrollPos = window.pageYOffset;
			if (prevScrollPos > currentScrollPos) {
				setIsVisible(true);
				//When setting is visible to true, check to see if the navbar should have a shadow
				//a shadow is necessary when you're not at the very top of the page. When you're at the very top of the page, no shadow.
				//height might not be the same. Ultimately, you might have to make the className dynamic as well.
			} else {
				setIsVisible(false);
			}
			prevScrollPos = currentScrollPos;
		};
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<nav className={isVisible ? "navbar" : "navbar hidden"}>
			<div className='logo'>
				<a href='/'>
					<Logo />
				</a>
			</div>
			<div className='nav_StyledLinks'>
				<ol>
					{routes.map((route, index) => (
						<li key={index} style={{ "--index": index + 1 }}>
							<a href={`/#${route.location}`}>{route.name}</a>
						</li>
					))}
				</ol>
				<div className='button-container' style={{ "--index": routes.length }}>
					<a className='button' target='_blank' href='/resume.pdf'>
						Resume
					</a>
				</div>
			</div>
		</nav>
	);
}
export default Navbar;

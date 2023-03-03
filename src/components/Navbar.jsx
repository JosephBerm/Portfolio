import React, { useState, useEffect } from "react";
import classNames from "classnames";
import Logo from "../assets/Logo";

function Navbar(props) {
	const [prevScrollPos, setPrevScrollPos] = useState(0);
	const [currentScrollPos, setCurrentScrollPos] = useState(0);
	const [navClass, setNavClass] = useState("navbar");

	useEffect(() => {
		const handleScroll = () => {
			let currentPos = window.scrollY;
			setPrevScrollPos(currentScrollPos);
			setCurrentScrollPos(currentPos);

			let visible = prevScrollPos > currentPos || currentPos === 0;
			const cn = classNames("navbar", {
				scrolled: currentPos > 0,
				hidden: !visible,
			});

			setNavClass(cn);
		};

		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [currentScrollPos, prevScrollPos]);

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

	return (
		<nav className={navClass}>
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

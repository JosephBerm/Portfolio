import React, { useState, useEffect } from "react";
import classNames from "classnames";
import Logo from "../assets/Logo";

function Navbar({ scrolledRef }) {
	const [navClass, setNavClass] = useState("navbar");
	const [currentScrollPos, setCurrentScrollPos] = useState(0);
	const [navStyleClassName, setNavStyleClassName] = useState("nav_StyledLinks");

	useEffect(() => {
		const handleScroll = () => {
			let currentPos = scrolledRef.current.scrollTop;
			setCurrentScrollPos(currentPos);
			const prevScrollPos = currentScrollPos;

			let visible = prevScrollPos > currentPos || currentPos === 0;
			const cn = classNames("navbar", {
				scrolled: currentPos > 0,
				hidden: !visible,
			});

			setNavClass(cn);
		};

		const currentRef = scrolledRef.current;
		currentRef.addEventListener("scroll", handleScroll);
		return () => {
			currentRef.removeEventListener("scroll", handleScroll);
		};
	}, [currentScrollPos, scrolledRef]);

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
	const handleOpenNavBar = () => {
		if (navStyleClassName.includes("opened")) {
			setNavStyleClassName("nav_StyledLinks closed");
		} else {
			setNavStyleClassName("nav_StyledLinks opened");
		}
		scrolledRef.current.classList.toggle("blur");
	};

	return (
		<nav className={navClass}>
			<div className='logo'>
				<a href='/'>
					<Logo />
				</a>
			</div>
			<div className='burger-button' onClick={() => handleOpenNavBar()}>
				<i className='fa-solid fa-bars' />
			</div>
			<div className={navStyleClassName}>
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

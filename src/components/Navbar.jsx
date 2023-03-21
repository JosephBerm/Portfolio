import React, { useState, useEffect } from "react";
import classNames from "classnames";
import Logo from "../assets/Logo";
import router from "./../services/router";

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

	const toggleNavbar = () => {
		if (navStyleClassName.includes("opened")) {
			setNavStyleClassName("nav_StyledLinks closed");
		} else {
			setNavStyleClassName("nav_StyledLinks opened");
		}
		scrolledRef.current.classList.toggle("blur");
	};

	const routeAndClose = (location) => {
		router.changeRoute(location);
		if (navStyleClassName.includes("opened")) {
			toggleNavbar();
		}
	};

	return (
		<nav className={navClass}>
			<div className='logo'>
				<a href='/'>
					<Logo />
				</a>
			</div>
			<div className='burger-button' onClick={() => toggleNavbar()}>
				<i className='fa-solid fa-bars' />
			</div>
			<div className={navStyleClassName}>
				<ol>
					{router.routes.map((route, index) => (
						<li key={index} style={{ "--index": index + 1 }}>
							<button
								className='clickable'
								onClick={() => routeAndClose(route.location)}>
								{route.name}
							</button>
						</li>
					))}
				</ol>
				<div
					className='button-container'
					style={{ "--index": router.routes.length }}>
					<a className='button' target='_blank' href='/resume.pdf'>
						Resume
					</a>
				</div>
			</div>
		</nav>
	);
}
export default Navbar;

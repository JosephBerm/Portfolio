import React, { useState, useEffect } from "react";
import Logo from "../assets/Logo";
import router from "./../services/router";
import classNames from "classnames";

function Navbar({ scrollable }) {
	const [navClass, setNavClass] = useState("header");
	const [currentScrollPos, setCurrentScrollPos] = useState(0);
	const [navStyleClassName, setNavStyleClassName] = useState("nav_StyledLinks");
	const [isNavSet, setIsNavSet] = useState(false);

	useEffect(() => {
		if (!scrollable) return;

		console.log("navbar useEffect called");
		let currentPos = document.body.scrollTop;

		const prevScrollPos = currentScrollPos;
		let visible = prevScrollPos > currentPos || currentPos === 0;
		const cn = classNames("header", {
			scrolled: currentPos > 0,
			hidden: !visible,
		});
		setNavClass(cn);
		if (!isNavSet) {
			scrollable.setupNavControl(setCurrentScrollPos);
			setIsNavSet(true);
		}
	}, [currentScrollPos, scrollable, isNavSet]);

	const toggleNavbar = () => {
		if (navStyleClassName.includes("opened")) {
			setNavStyleClassName("nav_StyledLinks closed");
		} else {
			setNavStyleClassName("nav_StyledLinks opened");
		}
		document.body.classList.toggle("blur");
	};

	const routeAndClose = (location) => {
		router.changeRoute(location);
		if (navStyleClassName.includes("opened")) {
			toggleNavbar();
		}
	};

	return (
		<header className={navClass}>
			<nav className='navbar'>
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
		</header>
	);
}
export default Navbar;

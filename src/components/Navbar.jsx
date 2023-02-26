import React from "react";
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
	return (
		<header>
			<nav>
				<div className='logo'>
					<a href='/'>
						<Logo />
					</a>
				</div>
				<div className='nav_StyledLinks'>
					<ol>
						{routes.map((route, index) => (
							<li key={index}>
								<a href={`/#${route.location}`}>{route.name}</a>
							</li>
						))}
					</ol>
					<div className='button-container'>
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

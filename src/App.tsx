import '../src/css/App.css'
import React, { useState, useEffect, useRef } from 'react'
import Navbar from './components/Navbar'
import Introduction from './components/Introduction'
import AboutMe from './components/AboutMe'
import Experience from './components/Experience'
import Projects from './components/Projects'
import ContactMe from './components/ContactMe'
import LoadingPage from './components/LoadingPage'
import Background from './components/Background'
import OtherProjects from './components/OtherProjects'
import AppFooter from './components/AppFooter'
import LeftSidePane from './components/LeftSidePane'
import RightSidePane from './components/RightSidePane'

const App: React.FC = () => {
	const [isLoading, setIsLoading] = useState<boolean>(true)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false)
		}, 3100)

		return () => clearTimeout(timer)
	}, [])

	if (isLoading) return <LoadingPage />

	return (
		<div className='App'>
			<Background />
			<Navbar />
			<LeftSidePane />
			<RightSidePane />
			<div id='content'>
				<main className='fillHeight'>
					<Introduction />
					<AboutMe />
					<Experience />
					<Projects />
					<OtherProjects />
					<ContactMe />
				</main>
				<AppFooter />
			</div>
		</div>
	)
}

export default App

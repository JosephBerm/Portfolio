import '@/css/App.css'
import React from 'react'
import Navbar from '@/components/Navbar'
import Introduction from '@/components/Introduction'
import AboutMe from '@/components/AboutMe'
import Experience from '@/components/Experience'
import Projects from '@/components/Projects'
import ContactMe from '@/components/ContactMe'
import LoadingPage from '@/components/LoadingPage'
import Background from '@/components/Background'
import OtherProjects from '@/components/OtherProjects'
import AppFooter from '@/components/AppFooter'
import LeftSidePane from '@/components/LeftSidePane'
import RightSidePane from '@/components/RightSidePane'

const App: React.FC = () => {
	return (
		<div className='App'>
			<LoadingPage />
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

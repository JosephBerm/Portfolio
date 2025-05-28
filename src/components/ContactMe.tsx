import React, { useContext } from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'

const ContactMe: React.FC = () => {
	const { userProfile } = usePortfolioStore()
	return (
		<section
			id='contact'
			className='section contact_section isNumbered'>
			<h2 className='section-header lineless'>What's Next?</h2>
			<h2 className='title'>Get In Touch</h2>
			<p>
				I'm always on the lookout for new ways to innovate. If you'd like to explore an idea together or just
				want to say hi, feel free to shoot me an email. I'll do my best to respond promptly and look forward to
				hearing from you!
			</p>
			<a
				className='button email-link'
				href={`mailto:${userProfile.email}?subject=Inquiry%20from%20Your%20Portfolio%20Website`}
				rel='noopener noreferrer'
				target='_blank'>
				Say Hello
			</a>
		</section>
	)
}

export default ContactMe

import React, { useContext } from "react";
import PortfolioContext from "./../context/portfolioContext";

function ContactMe({ contactRef }) {
	const { userProfile } = useContext(PortfolioContext);
	return (
		<section
			ref={contactRef}
			id='contact'
			className='section contact_section isNumbered'>
			<h2 className='section-header lineless'>What's Next?</h2>
			<h2 className='title'>Get In Touch</h2>
			<p>
				I'm always on the lookout for new ways to innovate. If you'd like to explore
				an idea together or just want to say hi, feel free to shoot me an email. I'll
				do my best to respond promptly and look forward to hearing from you!
			</p>
			<a
				className='button email-link'
				href={`mailto:${userProfile.email}`}
				rel='noopener noreferrer'
				target='_blank'>
				Say Hello
			</a>
		</section>
	);
}

export default ContactMe;

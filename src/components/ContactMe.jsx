import React from "react";

function ContactMe({ contactRef }) {
	return (
		<section ref={contactRef} id='contact' className='contact_section'>
			<h2 className='section-header'>Get In Touch</h2>
			<div className='section-body'>
				<p>
					Lorem, ipsum dolor sit amet consectetur adipisicing elit. Laboriosam omnis
					amet eius molestiae, numquam, cupiditate rem maxime sed, modi vitae
					possimus sapiente adipisci? Qui sapiente, nemo laudantium dolores, quos
					sequi ducimus enim facere omnis maiores corporis atque consequuntur.
				</p>
				<button>Say Hello</button>
			</div>
		</section>
	);
}

export default ContactMe;

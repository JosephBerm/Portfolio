import React from "react";

function AboutMe({ aboutRef }) {
	// useEffect(() =>
	// {
	// }, []);
	return (
		<section ref={aboutRef} id='about' className='about_section'>
			<h2 className='section-header'>About Me</h2>
			<div className='section-body'>
				<p>
					Hello! My name is Joseph and... Lorem ipsum dolor sit amet consectetur
					adipisicing elit. Veniam, dolor nostrum sapiente ullam repudiandae labore.
					Blanditiis ea consequuntur aspernatur alias fugiat totam! Illum, aut
					blanditiis.
				</p>
				<p>
					Lorem ipsum dolor, sit amet consectetur adipisicing elit. Modi alias, qui
					eius neque obcaecati exercitationem officiis, adipisci omnis ullam libero
					maxime sed quidem blanditiis, deleniti doloremque eveniet. Nemo doloribus
					ex sapiente. Libero eos eius quisquam. Veritatis iste error, amet nam
					magnam vero tenetur repellat at, quam alias dolor iusto!
				</p>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dignissimos nam
					quisquam tempore mollitia optio ut dolores incidunt hic, quas dolor
					voluptate! <strong>Expedita, natus omnis, quia,</strong> voluptates optio
					error non libero accusamus voluptatem distinctio atque facere.
				</p>
				<p>
					Lorem ipsum dolor sit amet <strong>consectetur adipisicing elit.</strong>{" "}
					Ab atque ex distinctio, aut quam expedita aperiam eaque magnam dolor
					corrupti.
				</p>
				<p>Here are a few technologies I've been working with recently:</p>
				<ol className='skills_list'>
					<li>JavaScript (ES6+)</li>
					<li>React</li>
					<li>Node.js</li>
					<li>TypeScript</li>
					<li>.NET Core</li>
					<li>Vue.js</li>
				</ol>
				<div className='photo-container'>
					<img src='' alt='' />
					<div className='background-border' />
					{/* Both are position absolute to the parent. img goes up-left a bit.
               The background-border goes down-right. Simply make a transition that moves
               background-border to the normal position of the whole container. */}
				</div>
			</div>
		</section>
	);
}

export default AboutMe;

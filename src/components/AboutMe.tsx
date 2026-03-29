import React from 'react'
import myPicture from '@/assets/myPicture.jpg'

const AboutMe: React.FC = () => {
	return (
		<section
			id='about'
			className='section about_section isNumbered'>
			<h2 className='section-header'>About Me</h2>
			<div className='section-body'>
				<div className='text-container'>
					<p>
						Hi, I&apos;m Joseph — a full-stack software engineer with 4+ years of professional
						experience building web applications in C#/.NET and TypeScript/React. I&apos;m the founder
						and sole developer of{' '}
						<a className='inline-link' href='https://vendorxpro.com' target='_blank' rel='noopener noreferrer'>
							VendorX
						</a>
						, a multi-tenant B2B ordering platform serving real customers in production.
					</p>
					<p>
						My path into engineering started in the summer of 2013, when I met someone who showed me
						how lines of code could turn a simple idea into a working product. That moment sparked a
						curiosity that hasn&apos;t stopped — and it&apos;s the same drive behind everything I
						build today.
					</p>
					<p>
						I specialize in owning features end-to-end, from database schema design to deployment
						pipelines. Whether it&apos;s architecting tenant-isolated systems with row-level security,
						integrating third-party platforms like Stripe and QuickBooks, or building real-time
						interfaces — I thrive on solving complex problems and shipping reliable software.
					</p>
					<p>Here are a few technologies I&apos;ve been working with recently:</p>
					<ul className='skills_list sfx'>
						<li>C# / .NET 10</li>
						<li>React 19</li>
						<li>TypeScript</li>
						<li>Next.js 16</li>
						<li>PostgreSQL</li>
						<li>Vue 3</li>
					</ul>
				</div>
				<div className='enclosed'>
					<div className='img-wrapper'>
						<picture className='photo-container'>
							<img
								src={myPicture}
								alt='Professional headshot of Joseph Bermudez'
								style={{ maxWidth: '100%', display: 'block', position: 'static' }}
							/>
						</picture>
					</div>
				</div>
			</div>
		</section>
	)
}

export default AboutMe

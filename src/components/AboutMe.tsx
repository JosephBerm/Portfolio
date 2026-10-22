import Image from 'next/image'
import { div as MotionDiv } from 'motion/react-client'
import { variants } from '@/lib/animations'
import { VENDORX_URL } from '@/lib/site'
import myPicture from '@/assets/images/myPicture.jpg'
import { FadeInSection, RevealItem } from '@/components/motion'
import TechList from '@/components/TechList'

/** Technologies listed under About Me. Kept here, not in portfolioInformation's default export, which Client Components import and would ship in client JS. */
const SKILLS = ['C# / .NET 10', 'React 19', 'TypeScript', 'Next.js 16', 'PostgreSQL', 'Vue 3', 'Elasticsearch', 'BigQuery']

export default function AboutMe() {
	return (
		<FadeInSection id="about" isNumbered>
			<RevealItem>
				<h2 className="section-header">About Me</h2>
			</RevealItem>
			{/* MotionDiv passes variant propagation through to stagger children inside the grid */}
			<MotionDiv
				variants={{ hidden: {}, visible: {} }}
				className="flex flex-col gap-[20px] md:grid md:grid-cols-[3fr_2fr] md:gap-[50px]"
			>
				<RevealItem className="w-full lg:w-[95%]">
					<p className="mb-[15px] lg:text-justify">
						I got into programming in the summer of 2013, after I met someone who showed me how code
						could turn a simple idea into a working product. I&apos;ve been writing software ever since.
						The tools keep changing, but I still like watching people get their work done with something
						I built.
					</p>
					<p className="mb-[15px] lg:text-justify">
						I started{' '}
						<a className="inline-link" href={VENDORX_URL} target="_blank" rel="noopener noreferrer">
							VendorX
						</a>{' '}
						in 2024 to give distributors and wholesalers a simpler way to sell online. In this industry,
						most orders still come in by phone, fax, or email. A custom ordering system can cost a
						distributor hundreds of thousands of dollars and take more than a year to build. VendorX is
						made mainly for electrical distributors, and it works for brands in other industries too.
					</p>
					<p className="mb-[15px] lg:text-justify">
						I&apos;m at my best when I can see a feature all the way through, including the database
						underneath it and the screen a customer sees. Owning the accounting platform at Relativistic
						Engine, where a refund has to match the books to the penny, has taught me to care about the
						details a business can&apos;t afford to get wrong and to test my work carefully before anyone
						relies on it.
					</p>
					<p className="mb-[15px] lg:text-justify">Here are a few technologies I&apos;ve been working with recently:</p>
					<TechList
						items={SKILLS}
						className="sfx grid grid-cols-[repeat(2,minmax(140px,200px))] gap-x-[10px] mt-[20px]"
						itemClassName="relative mb-[10px] pl-[20px] text-xs"
					/>
				</RevealItem>
				<MotionDiv
					variants={variants.scaleReveal}
					className="relative max-w-[300px] mx-auto mt-[50px] w-[70%] md:mx-0 md:mt-0"
				>
					<div className="img-wrapper">
						<div className="photo-container">
							{/* Static import supplies the real dimensions; eager so it loads as soon as content mounts. */}
							<Image
								src={myPicture}
								alt="Professional headshot of Joseph Bermudez"
								sizes="(max-width: 480px) 70vw, 300px"
								className="rounded-[4px] object-cover w-full h-auto"
								loading="eager"
							/>
						</div>
					</div>
				</MotionDiv>
			</MotionDiv>
		</FadeInSection>
	)
}

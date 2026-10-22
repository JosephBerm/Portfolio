import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from '@react-email/components'
import { siteConfig } from '@/lib/site'

interface BookingConfirmationEmailProps {
	visitorName: string
	formattedDate: string
	formattedTime: string
	timezone: string
	duration: number
	meetLink: string | null
	calendarUrl: string
}

/** Booking confirmation email — dark themed to match the portfolio site. */
export default function BookingConfirmationEmail({
	visitorName,
	formattedDate,
	formattedTime,
	timezone,
	duration,
	meetLink,
	calendarUrl,
}: BookingConfirmationEmailProps) {
	return (
		<Html lang="en">
			<Head />
			<Preview>Your meeting with Joseph Bermudez is confirmed</Preview>
			<Body style={body}>
				<Container style={container}>
					{/* Header */}
					<Section style={header}>
						<Heading as="h1" style={heading}>
							Your meeting is booked
						</Heading>
						<Text style={subheading}>
							Hi {visitorName}, thanks for booking a time to talk. I&apos;m looking forward to it.
						</Text>
					</Section>

					<Hr style={divider} />

					{/* Meeting details card */}
					<Section style={card}>
						<Text style={dateText}>{formattedDate}</Text>
						<Text style={timeText}>{formattedTime}</Text>
						<Text style={metaText}>
							{duration} minutes &middot; {timezone}
						</Text>
					</Section>

					{/* Google Meet link */}
					{meetLink && (
						<Section style={meetSection}>
							<Link href={meetLink} style={meetButton}>
								Join Google Meet &rarr;
							</Link>
						</Section>
					)}

					{/* Add to Calendar */}
					<Section style={calendarSection}>
						<Link href={calendarUrl} style={calendarButton}>
							Add to Calendar
						</Link>
					</Section>

					<Hr style={divider} />

					{/* Footer */}
					<Section style={footer}>
						<Text style={footerText}>
							You&apos;re receiving this because you booked a meeting on{' '}
							<Link href={siteConfig.url} style={footerLink}>
								josephbermudez.com
							</Link>
							.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

// ── Styles ──────────────────────────────────────────────────────
// Inline styles are required for email clients — CSS classes are unreliable.

const body: React.CSSProperties = {
	backgroundColor: '#0a192f',
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
	margin: 0,
	padding: 0,
}

const container: React.CSSProperties = {
	maxWidth: '480px',
	margin: '0 auto',
	padding: '40px 24px',
}

const header: React.CSSProperties = {
	textAlign: 'center' as const,
	padding: '0 0 8px',
}

const heading: React.CSSProperties = {
	color: '#64ffda',
	fontSize: '24px',
	fontWeight: 600,
	margin: '0 0 8px',
}

const subheading: React.CSSProperties = {
	color: '#8892b0',
	fontSize: '14px',
	fontFamily: '"Fira Code", "Courier New", monospace',
	margin: 0,
}

const divider: React.CSSProperties = {
	borderColor: '#233554',
	borderWidth: '1px 0 0',
	margin: '24px 0',
}

const card: React.CSSProperties = {
	backgroundColor: '#112240',
	borderRadius: '16px',
	border: '1px solid rgba(168, 178, 209, 0.1)',
	padding: '24px',
	textAlign: 'center' as const,
}

const dateText: React.CSSProperties = {
	color: '#ccd6f6',
	fontSize: '16px',
	fontWeight: 500,
	margin: '0 0 4px',
}

const timeText: React.CSSProperties = {
	color: '#64ffda',
	fontSize: '14px',
	fontFamily: '"Fira Code", "Courier New", monospace',
	margin: '0 0 4px',
}

const metaText: React.CSSProperties = {
	color: '#495670',
	fontSize: '12px',
	fontFamily: '"Fira Code", "Courier New", monospace',
	margin: 0,
}

const meetSection: React.CSSProperties = {
	textAlign: 'center' as const,
	padding: '8px 0 0',
}

const meetButton: React.CSSProperties = {
	display: 'inline-block',
	backgroundColor: 'transparent',
	border: '1px solid #64ffda',
	borderRadius: '8px',
	color: '#64ffda',
	fontSize: '13px',
	fontFamily: '"Fira Code", "Courier New", monospace',
	padding: '12px 24px',
	textDecoration: 'none',
}

const calendarSection: React.CSSProperties = {
	textAlign: 'center' as const,
	padding: '8px 0 0',
}

const calendarButton: React.CSSProperties = {
	display: 'inline-block',
	backgroundColor: '#64ffda',
	borderRadius: '8px',
	color: '#0a192f',
	fontSize: '13px',
	fontFamily: '"Fira Code", "Courier New", monospace',
	fontWeight: 600,
	padding: '12px 24px',
	textDecoration: 'none',
}

const footer: React.CSSProperties = {
	textAlign: 'center' as const,
}

const footerText: React.CSSProperties = {
	color: '#495670',
	fontSize: '11px',
	fontFamily: '"Fira Code", "Courier New", monospace',
	margin: 0,
	lineHeight: '18px',
}

const footerLink: React.CSSProperties = {
	color: '#64ffda',
	textDecoration: 'none',
}

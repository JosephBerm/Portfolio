import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/metadata'
import { MEETING_DURATION } from '@/lib/scheduleConfig'
import SchedulePage from '@/components/links/schedule/SchedulePage'

export const metadata: Metadata = createPageMetadata({
	title: 'Schedule',
	description: `Book a ${MEETING_DURATION}-minute call with Joseph Bermudez.`,
	path: '/links/schedule',
})

export default function ScheduleRoute() {
	return <SchedulePage />
}

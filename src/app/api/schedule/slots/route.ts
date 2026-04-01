import { NextRequest, NextResponse } from 'next/server'
import { slotsQuerySchema } from '@/lib/validations'
import { getAvailableSlotsForDate } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
	const dateParam = request.nextUrl.searchParams.get('date')

	const parsed = slotsQuerySchema.safeParse({ date: dateParam })
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? 'Invalid date parameter' },
			{ status: 400 },
		)
	}

	const slots = await getAvailableSlotsForDate(parsed.data.date)

	return NextResponse.json({ slots })
}

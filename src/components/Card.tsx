import { cn } from '@/lib'

interface CardProps {
	cssClass?: string
	children: React.ReactNode
}

export default function Card({ cssClass = '', children }: CardProps) {
	return (
		<div className={cn(
			'gradient-card flex flex-col justify-between items-start p-[3rem_2.5rem] md:p-[4rem_2.5rem]',
			cssClass
		)}>
			{children}
		</div>
	)
}

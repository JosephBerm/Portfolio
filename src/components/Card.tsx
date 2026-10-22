interface CardProps {
	children: React.ReactNode
}

export default function Card({ children }: CardProps) {
	return (
		<div className="gradient-card flex flex-col justify-between items-start p-[3rem_2.5rem] md:p-[4rem_2.5rem]">
			{children}
		</div>
	)
}

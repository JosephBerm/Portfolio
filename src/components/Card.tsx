import React from "react";

interface ICardProps {
	cssClass?: string
	children: React.ReactNode
}

function Card({ cssClass = '', children }: ICardProps) {
	let className = 'card'
	if (cssClass) className += ` ${cssClass}`

	return <div className={className}>{children}</div>
}

export default Card

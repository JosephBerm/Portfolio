import React from "react";

function Card({ cssClass = "", children }) {
	let className = "card";
	if (cssClass) className += ` ${cssClass}`;

	return <div className={className}>{children}</div>;
}

export default Card;

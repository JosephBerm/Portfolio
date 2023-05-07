import React from "react";
import LinksList from "../common/LinksList";

function LeftSidePane(props) {
	return (
		<div orientation='left' className='LeftSidePane'>
			<LinksList />
		</div>
	);
}

export default LeftSidePane;

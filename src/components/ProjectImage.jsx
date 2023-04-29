import React from "react";

function ProjectImage({ imageDetails }) {
	return (
		<div className='project-image'>
			<a href={imageDetails.link} rel='noopener noreferrer' target='_blank'>
				<div className='image-wrapper'>{imageDetails.randomText}</div>
			</a>
		</div>
	);
}

export default ProjectImage;

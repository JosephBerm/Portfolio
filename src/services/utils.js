export function getTextWithLinks(str, links) {
	let allText = str;

	for (let key in links) {
		const { text, link } = links[key];
		const regex = new RegExp(text, "g");
		allText = allText.replace(
			regex,
			`<a
					href=${link} 
					target="_blank"
					rel='noopener noreferrer'
					>
					${text}
				</a>`
		);
	}

	return <p dangerouslySetInnerHTML={{ __html: allText }} />;
}

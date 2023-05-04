export default function observe(sections, thresholdMap) {
	const observers = sections.map((s) => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					entry.target.classList.toggle("activated", entry.isIntersecting);
					if (entry.isIntersecting) observer.unobserve(entry.target);
				});
			},
			{ threshold: thresholdMap[s.id] }
		);
		observer.observe(s);
		return observer;
	});

	return observers;
}

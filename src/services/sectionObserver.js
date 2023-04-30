function callBack(entries) {
	entries.forEach((entry) => {
		entry.target.classList.toggle("activated", entry.isIntersecting);
		if (entry.isIntersecting) observer.unobserve(entry.target);
	});
}

let options = {
	threshold: 0.17,
};

const observer = new IntersectionObserver(callBack, options);

export default function observe(sections) {
	sections.forEach((s) => {
		observer.observe(s);
	});
}

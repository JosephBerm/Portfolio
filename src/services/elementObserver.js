function callBack(elements) {
	elements.forEach((element) => {
		element.target.classList.toggle("activated", element.isIntersecting);
		if (element.isIntersecting) observer.unobserve(element.target);
	});
}

let options = {
	threshold: 0.5,
};

const observer = new IntersectionObserver(callBack, options);

export default function observe(elements) {
	elements.forEach((s) => {
		observer.observe(s);
	});
}

class ScrollService {
	constructor(elements) {
		this.onScroll = null;
		this.bodyElem = document.body;
		this.elements = elements ? elements : null;
		console.log("ScrollService Constructor called: ", this.bodyElem);
	}
	get allElements() {
		return this.elements;
	}

	addElement = (elem) => {
		this.elements.push(elem);
	};
	setupNavControl = (setCurrentScrollPos) => {
		this.onScroll = () => {
			console.log("called onScroll");
			this.animateIntoView();
			let currentPos = this.bodyElem.scrollTop;
			setCurrentScrollPos(currentPos);
		};

		this.setupScrollEvent();
		// this.cleanScrollEvent();
	};

	animateIntoView = () => {
		const windowHeight = window.innerHeight;
		const offset = 300;
		const scrollTop = this.bodyElem.scrollTop - offset;
		// Loop through each section and check if it's visible
		this.elements.forEach((section) => {
			const sectionTop = section.current.offsetTop;
			const sectionHeight = section.current.offsetHeight;

			if (
				sectionTop < scrollTop + windowHeight &&
				sectionTop + sectionHeight > scrollTop
			) {
				if (!section.current.classList.contains("activated")) {
					section.current.classList.add("activated");
				}
			}
		});
	};

	setupScrollEvent = () => {
		if (!this.bodyElem) return;
		console.log("this.onScroll is a:", typeof this.onScroll);
		this.bodyElem.addEventListener("scroll2", this.onScroll);
	};

	cleanScrollEvent = () => {
		return () => {
			this.bodyElem.removeEventListener("scroll", this.onScroll);
		};
	};
}

export default ScrollService;

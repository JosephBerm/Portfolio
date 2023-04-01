class ScrollService {
	constructor(sections) {
		this.sections = sections;
	}

	getSections = () => {
		return this.sections;
	};

	handleScroll = () => {
		const windowHeight = window.innerHeight;
		const scrollTop = this.scrolledRef.current.scrollTop - 150;
		// Loop through each section and check if it's visible
		this.sections.forEach((section) => {
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

	linkMain = (scrolledRef) => {
		this.scrolledRef = scrolledRef;
		//this might work for creating the events outside the useEffect so it happens once?
		this.setupScrollEvent();
		return this.cleanScrollEvent();
	};

	setupScrollEvent = () => {
		if (!this.scrolledRef.current) return;
		console.log("after return HANDLER", this.scrolledRef.current);
		this.scrolledRef.current.addEventListener("scroll", this.handleScroll);
	};

	cleanScrollEvent = () => {
		return () => {
			this.scrolledRef.removeEventListener("scroll", this.handleScroll);
		};
	};
}

export default ScrollService;

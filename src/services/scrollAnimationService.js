import classNames from "classnames";

class ScrollService {
	onScroll = null;
	sections = null;
	scrolledRef = null;

	constructor(sections, scrolledRef) {
		this.sections = sections;
		this.scrolledRef = scrolledRef;
	}

	getSections = () => {
		return this.sections;
	};
	setupScrollEvents = (currentScrollPos, setCurrentScrollPos, setNavClass) => {
		this.onScroll = () => {
			this.animateIntoView();
			let currentPos = this.scrolledRef.current.scrollTop;
			setCurrentScrollPos(currentPos);
			const prevScrollPos = currentScrollPos;

			let visible = prevScrollPos > currentPos || currentPos === 0;
			const cn = classNames("navbar", {
				scrolled: currentPos > 0,
				hidden: !visible,
			});

			setNavClass(cn);
		};

		this.setupScrollEvent();
		this.cleanScrollEvent();
	};

	animateIntoView = () => {
		const windowHeight = window.innerHeight;
		const offset = 300;
		const scrollTop = this.scrolledRef.current.scrollTop - offset;
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

	setupScrollEvent = () => {
		if (!this.scrolledRef.current) return;
		this.scrolledRef.current.addEventListener("scroll", this.onScroll);
	};

	cleanScrollEvent = () => {
		return () => {
			this.scrolledRef.removeEventListener("scroll", this.onScroll);
		};
	};
}

export default ScrollService;

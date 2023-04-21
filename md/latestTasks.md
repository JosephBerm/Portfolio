# App.css

# Navbar

- [x] Create Responsive Navbar.
- [ ] When user scrolls down one time and then back up, the height readjusts itself twice because the className is changed twice.

# Hero Section

[.] I last fixed the scrollbar going over the navigation bar. I now need to change the scroll events from being on the app ref to the body of the app. I am now working in [Scroll Animate Service](../src/services/scrollAnimationService.js)

THE COMBINATION OF 100VH AND OVERFLOW-X CAUSES THE SCROLLBAR TO GO UNDER THE NAVBAR.

# Background

[] Must dynamically render the shooting star depending on gravity. If gravity is on, display none the one that goes north. if off, display none the south one.

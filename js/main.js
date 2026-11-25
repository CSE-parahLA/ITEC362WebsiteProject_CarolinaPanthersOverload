// main.js - runs on every page
// 1. Marks the current page in the navigation
// 2. Adds a "Back to top" button

// ----- 1. Highlight the current page link -----
var currentPage = location.pathname.split('/').pop();
if (currentPage === '') {
    currentPage = 'index.html';
}

var navLinks = document.querySelectorAll('header nav a');
for (var i = 0; i < navLinks.length; i++) {
    if (navLinks[i].getAttribute('href') === currentPage) {
        navLinks[i].setAttribute('aria-current', 'page');
    }
}

// ----- 2. Back to top button -----
var topButton = document.createElement('button');
topButton.type = 'button';
topButton.id = 'back-to-top';
topButton.textContent = 'Top';
topButton.setAttribute('aria-label', 'Back to top of page');
topButton.hidden = true;
document.body.appendChild(topButton);

// show the button only after scrolling down
window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
        topButton.hidden = false;
    } else {
        topButton.hidden = true;
    }
});

topButton.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// units.js - unit finder for the depth chart page
// Filter by side of the ball, search players, and hide/show position groups

var sideButtons = document.querySelectorAll('[data-side]');
var searchBox = document.getElementById('unit-search');
var statusText = document.getElementById('unit-status');
var emptyMessage = document.getElementById('unit-empty');
var sections = document.querySelectorAll('main > section[id]');

var currentSide = 'all';
var searchText = '';

// groups holds one object for every position group (QB, RB, WR ...)
var groups = [];

for (var i = 0; i < sections.length; i++) {
    var section = sections[i];
    var headings = section.querySelectorAll('h3');

    if (headings.length === 0) {
        // special teams has one list and no h3 headings
        groups.push({
            section: section,
            heading: null,
            list: section.querySelector('ul'),
            name: 'Special Teams',
            tag: '',
            hidden: false
        });
    } else {
        for (var j = 0; j < headings.length; j++) {
            var title = headings[j].textContent;
            // get the tag inside the brackets, e.g. "Cornerbacks (CB)" -> "cb"
            var tag = '';
            var start = title.indexOf('(');
            var end = title.indexOf(')');
            if (start !== -1 && end !== -1) {
                tag = title.substring(start + 1, end).toLowerCase();
            }
            groups.push({
                section: section,
                heading: headings[j],
                list: headings[j].nextElementSibling,
                name: title,
                tag: tag,
                hidden: false
            });
        }
    }
}

// add a player count and a Hide/Show button to each heading
for (var g = 0; g < groups.length; g++) {
    addControls(groups[g], g);
}

function addControls(group, number) {
    if (group.heading === null) {
        return;
    }
    group.badge = document.createElement('span');
    group.badge.className = 'count-badge';

    group.button = document.createElement('button');
    group.button.type = 'button';
    group.button.className = 'secondary';
    group.button.textContent = 'Hide';
    group.button.setAttribute('aria-expanded', 'true');
    group.button.setAttribute('aria-label', 'Hide ' + group.name);

    group.heading.className = 'group-heading';
    group.heading.appendChild(group.badge);
    group.heading.appendChild(group.button);

    group.button.addEventListener('click', function () {
        setGroupHidden(group, !group.hidden);
        updatePage();
    });
}

function setGroupHidden(group, hide) {
    group.hidden = hide;
    if (group.button) {
        if (hide) {
            group.button.textContent = 'Show';
            group.button.setAttribute('aria-expanded', 'false');
            group.button.setAttribute('aria-label', 'Show ' + group.name);
        } else {
            group.button.textContent = 'Hide';
            group.button.setAttribute('aria-expanded', 'true');
            group.button.setAttribute('aria-label', 'Hide ' + group.name);
        }
    }
}

// does one player (li) match the search?
function playerMatches(li, group) {
    if (searchText === '') {
        return true;
    }
    var text = li.textContent.toLowerCase();

    // a search like "9" or "#9" looks for that jersey number
    if (/^#?\d{1,2}$/.test(searchText)) {
        var number = searchText.replace('#', '');
        return text.indexOf('#' + number + ' ') === 0;
    }
    // a search like "cb" matches the whole position group
    if (group.tag !== '' && group.tag.indexOf(searchText) === 0 && searchText.length <= 3) {
        return true;
    }
    return text.indexOf(searchText) !== -1;
}

// update everything on the page based on the side button and search
function updatePage() {
    var total = 0;

    for (var s = 0; s < sections.length; s++) {
        sections[s].hidden = true;   // hide the section, then show it if it has players
    }

    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var items = group.list.querySelectorAll('li');
        var count = 0;
        var sideOk = (currentSide === 'all' || currentSide === group.section.id);

        for (var j = 0; j < items.length; j++) {
            if (sideOk && playerMatches(items[j], group)) {
                items[j].hidden = false;
                count = count + 1;
                if (searchText !== '') {
                    items[j].className = 'match';
                } else {
                    items[j].className = '';
                }
            } else {
                items[j].hidden = true;
            }
        }

        if (group.heading !== null) {
            if (count === 1) {
                group.badge.textContent = '1 player';
            } else {
                group.badge.textContent = count + ' players';
            }
            group.heading.hidden = (count === 0);
        }
        group.list.hidden = (count === 0 || group.hidden);

        if (count > 0) {
            group.section.hidden = false;
        }
        total = total + count;
    }

    if (total === 0) {
        statusText.textContent = '';
        emptyMessage.hidden = false;
    } else {
        if (total === 1) {
            statusText.textContent = 'Showing 1 player.';
        } else {
            statusText.textContent = 'Showing ' + total + ' players.';
        }
        emptyMessage.hidden = true;
    }
}

// choose which side of the ball to show
function chooseSide(side) {
    currentSide = side;
    for (var i = 0; i < sideButtons.length; i++) {
        if (sideButtons[i].getAttribute('data-side') === side) {
            sideButtons[i].setAttribute('aria-pressed', 'true');
        } else {
            sideButtons[i].setAttribute('aria-pressed', 'false');
        }
    }
    updatePage();
}

for (var b = 0; b < sideButtons.length; b++) {
    sideButtons[b].addEventListener('click', function (event) {
        chooseSide(event.target.getAttribute('data-side'));
    });
}

// wait a moment after typing stops before searching (timer)
var timer;
searchBox.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
        searchText = searchBox.value.trim().toLowerCase();
        updatePage();
    }, 200);
});

function setAllGroups(hide) {
    for (var i = 0; i < groups.length; i++) {
        setGroupHidden(groups[i], hide);
    }
    updatePage();
}

document.getElementById('unit-collapse').addEventListener('click', function () { setAllGroups(true); });
document.getElementById('unit-expand').addEventListener('click', function () { setAllGroups(false); });
document.getElementById('unit-controls').addEventListener('submit', function (e) {
    e.preventDefault();
});

// support links like units.html#defense
var hash = location.hash.replace('#', '');
if (hash === 'offense' || hash === 'defense' || hash === 'special-teams') {
    chooseSide(hash);
} else {
    updatePage();
}

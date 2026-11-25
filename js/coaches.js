// coaches.js - filter coaches by role and show/hide their details

var filterSelect = document.getElementById('staff-filter');
var statusText = document.getElementById('staff-status');
var collapseButton = document.getElementById('staff-collapse');
var expandButton = document.getElementById('staff-expand');

// get every coach section (skip the "Staff Tools" box)
var allSections = document.querySelectorAll('main > section');
var coaches = [];

for (var i = 0; i < allSections.length; i++) {
    if (allSections[i].className.indexOf('controls') === -1) {
        coaches.push(allSections[i]);
    }
}

// figure out the role from the h2 text
function getRole(section) {
    var title = section.querySelector('h2').textContent.toLowerCase();
    if (title.indexOf('head') !== -1) {
        return 'head';
    } else if (title.indexOf('offensive') !== -1) {
        return 'offense';
    } else if (title.indexOf('defensive') !== -1) {
        return 'defense';
    } else if (title.indexOf('special') !== -1) {
        return 'special';
    }
    return 'other';
}

// show or hide the list of details for one coach
function setDetails(section, hide) {
    var list = section.querySelector('ul');
    var button = section.querySelector('button');
    var name = section.querySelector('h2').firstChild.textContent;

    list.hidden = hide;
    if (hide === true) {
        button.textContent = 'Show details';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Show details for ' + name);
    } else {
        button.textContent = 'Hide details';
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'Hide details for ' + name);
    }
}

// add a button to each coach heading
function addButton(section) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary coach-details-button';
    button.style.marginLeft = '1rem';
    section.querySelector('h2').appendChild(button);

    button.addEventListener('click', function () {
        var list = section.querySelector('ul');
        setDetails(section, !list.hidden);   // flip between shown and hidden
    });

    setDetails(section, false);
}

for (var j = 0; j < coaches.length; j++) {
    addButton(coaches[j]);
}

// filter by role
function applyFilter() {
    var chosen = filterSelect.value;
    var shown = 0;

    for (var k = 0; k < coaches.length; k++) {
        if (chosen === 'all' || getRole(coaches[k]) === chosen) {
            coaches[k].hidden = false;
            shown = shown + 1;
        } else {
            coaches[k].hidden = true;
        }
    }
    statusText.textContent = 'Showing ' + shown + ' of ' + coaches.length + ' roles.';
}

function setAllDetails(hide) {
    for (var m = 0; m < coaches.length; m++) {
        setDetails(coaches[m], hide);
    }
}

filterSelect.addEventListener('change', applyFilter);
collapseButton.addEventListener('click', function () { setAllDetails(true); });
expandButton.addEventListener('click', function () { setAllDetails(false); });
document.getElementById('staff-controls').addEventListener('submit', function (e) {
    e.preventDefault();
});

applyFilter();

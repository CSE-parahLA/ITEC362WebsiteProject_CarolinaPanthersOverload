// players.js - interactive roster table
// Search, position filter, age range, sorting, favorites and stats

var table = document.getElementById('roster-table');
var tbody = table.tBodies[0];
var headRow = table.tHead.rows[0];

var searchBox = document.getElementById('player-search');
var groupSelect = document.getElementById('position-filter');
var minAgeBox = document.getElementById('min-age');
var maxAgeBox = document.getElementById('max-age');
var sortSelect = document.getElementById('sort-key');
var dirSelect = document.getElementById('sort-dir');
var favOnlyBox = document.getElementById('favorites-only');
var clearFavButton = document.getElementById('clear-favorites');
var resetButton = document.getElementById('reset-filters');
var form = document.getElementById('roster-controls');
var errorText = document.getElementById('form-error');
var countText = document.getElementById('results-count');
var statsBox = document.getElementById('roster-stats');
var noResults = document.getElementById('no-results');

// ---------- Settings ----------
// position groups: name, label, and the positions inside each group
var groupNames = ['all', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'ST'];
var groupLabels = ['All positions', 'Quarterbacks (QB)', 'Running backs (RB)', 'Wide receivers (WR)',
    'Tight ends (TE)', 'Offensive line (C, G, T, OL)', 'Defensive line (DT)',
    'Linebackers (LB, OLB)', 'Defensive backs (CB, S)', 'Special teams (K, P, LS)'];
var groupPositions = {
    QB: ['QB'],
    RB: ['RB'],
    WR: ['WR'],
    TE: ['TE'],
    OL: ['C', 'G', 'T', 'OT', 'OL'],
    DL: ['DT'],
    LB: ['LB', 'OLB'],
    DB: ['CB', 'S'],
    ST: ['K', 'P', 'LS']
};

// sort options: key used in the code, label, and which table column it is
var sortKeys = ['number', 'name', 'position', 'height', 'weight', 'age', 'exp', 'college'];
var sortLabels = ['Jersey number', 'Name', 'Position', 'Height', 'Weight', 'Age', 'Experience', 'College'];
var sortColumns = [2, 1, 3, 4, 5, 6, 7, 8];

// current filter and sort choices
var searchText = '';
var selectedGroup = 'all';
var minAge = null;
var maxAge = null;
var sortKey = 'number';
var sortDir = 'asc';
var favoritesOnly = false;

// ---------- Favorites (saved in the browser) ----------
var favorites = [];
var savedFavorites = localStorage.getItem('cpo-favorites');
if (savedFavorites !== null) {
    favorites = JSON.parse(savedFavorites);
}

function saveFavorites() {
    localStorage.setItem('cpo-favorites', JSON.stringify(favorites));
}

// ---------- Read the table rows into an array ----------
// turns a height like "6-4" into inches (76)
function heightToInches(text) {
    var parts = text.split('-');
    return Number(parts[0]) * 12 + Number(parts[1]);
}

var players = [];
for (var i = 0; i < tbody.rows.length; i++) {
    var row = tbody.rows[i];
    var cells = row.cells;

    var exp = cells[7].textContent.trim();
    if (exp === 'R') {
        exp = 0;   // R means rookie
    } else {
        exp = Number(exp);
    }

    players.push({
        row: row,
        order: i,
        name: cells[1].textContent.trim(),
        number: Number(cells[2].textContent),
        position: cells[3].textContent.trim(),
        height: heightToInches(cells[4].textContent),
        weight: Number(cells[5].textContent),
        age: Number(cells[6].textContent),
        exp: exp,
        college: cells[8].textContent.trim()
    });
}

// ---------- Build the dropdown options ----------
for (var g = 0; g < groupNames.length; g++) {
    groupSelect.appendChild(new Option(groupLabels[g], groupNames[g]));
}
for (var s = 0; s < sortKeys.length; s++) {
    sortSelect.appendChild(new Option(sortLabels[s], sortKeys[s]));
}

// ---------- Add the favorite column and star buttons ----------
var favHeader = document.createElement('th');
favHeader.textContent = 'Favorite';
headRow.appendChild(favHeader);

function updateStar(player) {
    var isFav = favorites.indexOf(player.name) !== -1;
    player.star.setAttribute('aria-pressed', String(isFav));
    if (isFav) {
        player.star.setAttribute('aria-label', 'Remove ' + player.name + ' from favorites');
    } else {
        player.star.setAttribute('aria-label', 'Add ' + player.name + ' to favorites');
    }
}

function toggleFavorite(player) {
    var position = favorites.indexOf(player.name);
    if (position === -1) {
        favorites.push(player.name);        // add
    } else {
        favorites.splice(position, 1);      // remove
    }
    saveFavorites();
    updateStar(player);
    showPlayers();
}

function addStar(player) {
    var cell = document.createElement('td');
    var star = document.createElement('button');
    star.type = 'button';
    star.className = 'fav-btn';
    star.textContent = '\u2605';
    cell.appendChild(star);
    player.row.appendChild(cell);
    player.star = star;
    updateStar(player);

    star.addEventListener('click', function () {
        toggleFavorite(player);
    });
}

for (var p = 0; p < players.length; p++) {
    addStar(players[p]);
}

// ---------- Make column headers into sort buttons ----------
function addSortButton(key, column) {
    var th = headRow.cells[column];
    var label = th.textContent.trim();
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-label', 'Sort by ' + label);
    th.textContent = '';
    th.appendChild(button);
    th.setAttribute('data-sort-key', key);

    button.addEventListener('click', function () {
        if (sortKey === key) {
            // same column clicked again, flip the direction
            if (sortDir === 'asc') {
                sortDir = 'desc';
            } else {
                sortDir = 'asc';
            }
        } else {
            sortKey = key;
            sortDir = 'asc';
        }
        sortSelect.value = sortKey;
        dirSelect.value = sortDir;
        showPlayers();
    });
}

for (var k = 0; k < sortKeys.length; k++) {
    addSortButton(sortKeys[k], sortColumns[k]);
}

// ---------- Filtering ----------
// does this player match the search box?
function matchesSearch(player) {
    if (searchText === '') {
        return true;
    }
    // "#9" or "9" searches the jersey number
    if (/^#?\d{1,2}$/.test(searchText)) {
        var number = Number(searchText.replace('#', ''));
        return player.number === number;
    }
    if (player.name.toLowerCase().indexOf(searchText) !== -1) {
        return true;
    }
    if (player.college.toLowerCase().indexOf(searchText) !== -1) {
        return true;
    }
    // exact position, like "qb"
    return player.position.toLowerCase() === searchText;
}

// should this player be shown?
function passesFilters(player) {
    if (matchesSearch(player) === false) {
        return false;
    }
    if (selectedGroup !== 'all') {
        if (groupPositions[selectedGroup].indexOf(player.position) === -1) {
            return false;
        }
    }
    if (minAge !== null && player.age < minAge) {
        return false;
    }
    if (maxAge !== null && player.age > maxAge) {
        return false;
    }
    if (favoritesOnly === true && favorites.indexOf(player.name) === -1) {
        return false;
    }
    return true;
}

// ---------- Sorting ----------
function comparePlayers(a, b) {
    var result;
    if (typeof a[sortKey] === 'string') {
        result = a[sortKey].localeCompare(b[sortKey]);
    } else {
        result = a[sortKey] - b[sortKey];
    }
    if (result === 0) {
        result = a.order - b.order;   // keep the original order for ties
    }
    if (sortDir === 'desc') {
        result = -result;
    }
    return result;
}

// ---------- Age validation ----------
// returns an error message, or '' if the age is ok
function checkAge(text, label) {
    if (text === '') {
        return '';
    }
    var age = Number(text);
    if (Number.isInteger(age) === false) {
        return label + ' age must be a whole number.';
    }
    if (age < 18 || age > 45) {
        return label + ' age must be between 18 and 45.';
    }
    return '';
}

// reads the two age boxes. Returns true if they are valid.
function readAges() {
    var minText = minAgeBox.value.trim();
    var maxText = maxAgeBox.value.trim();
    var message = checkAge(minText, 'Minimum');

    if (message === '') {
        message = checkAge(maxText, 'Maximum');
    }
    if (message === '' && minText !== '' && maxText !== '' && Number(minText) > Number(maxText)) {
        message = 'Minimum age cannot be greater than maximum age.';
    }

    minAgeBox.removeAttribute('aria-invalid');
    maxAgeBox.removeAttribute('aria-invalid');
    errorText.textContent = message;

    if (message !== '') {
        minAgeBox.setAttribute('aria-invalid', 'true');
        maxAgeBox.setAttribute('aria-invalid', 'true');
        return false;
    }

    minAge = (minText === '') ? null : Number(minText);
    maxAge = (maxText === '') ? null : Number(maxText);
    return true;
}

// ---------- Stats ----------
function showStats(list) {
    statsBox.innerHTML = '';
    if (list.length === 0) {
        return;
    }

    var totalAge = 0;
    var totalWeight = 0;
    var totalExp = 0;
    var rookies = 0;
    var oldest = list[0];

    for (var i = 0; i < list.length; i++) {
        totalAge = totalAge + list[i].age;
        totalWeight = totalWeight + list[i].weight;
        totalExp = totalExp + list[i].exp;
        if (list[i].exp === 0) {
            rookies = rookies + 1;
        }
        if (list[i].age > oldest.age) {
            oldest = list[i];
        }
    }

    var lines = [
        'Average age: ' + (totalAge / list.length).toFixed(1),
        'Average weight: ' + Math.round(totalWeight / list.length) + ' lb',
        'Average experience: ' + (totalExp / list.length).toFixed(1) + ' yrs',
        'Rookies: ' + rookies,
        'Oldest: ' + oldest.name + ' (' + oldest.age + ')'
    ];

    for (var j = 0; j < lines.length; j++) {
        var span = document.createElement('span');
        span.textContent = lines[j];
        statsBox.appendChild(span);
    }
}

// ---------- Main function: filter, sort, and update the table ----------
function showPlayers() {
    // 1. find the players that pass the filters
    var visible = [];
    var hiddenPlayers = [];
    for (var i = 0; i < players.length; i++) {
        if (passesFilters(players[i])) {
            visible.push(players[i]);
        } else {
            hiddenPlayers.push(players[i]);
        }
    }

    // 2. sort them
    visible.sort(comparePlayers);

    // 3. put the rows back in the table in the new order
    for (var j = 0; j < visible.length; j++) {
        visible[j].row.hidden = false;
        tbody.appendChild(visible[j].row);
    }
    for (var m = 0; m < hiddenPlayers.length; m++) {
        hiddenPlayers[m].row.hidden = true;
        tbody.appendChild(hiddenPlayers[m].row);
    }

    // 4. mark which column is sorted
    for (var c = 0; c < headRow.cells.length; c++) {
        var th = headRow.cells[c];
        if (th.getAttribute('data-sort-key') === sortKey) {
            if (sortDir === 'asc') {
                th.setAttribute('aria-sort', 'ascending');
            } else {
                th.setAttribute('aria-sort', 'descending');
            }
        } else {
            th.removeAttribute('aria-sort');
        }
    }

    // 5. update the messages
    var message = 'Showing ' + visible.length + ' of ' + players.length + ' players';
    if (favorites.length > 0) {
        message = message + ' - ' + favorites.length + ' favorite(s)';
    }
    countText.textContent = message;

    if (visible.length === 0) {
        noResults.hidden = false;
        table.hidden = true;
    } else {
        noResults.hidden = true;
        table.hidden = false;
    }
    showStats(visible);
}

// ---------- Events ----------
// wait 200ms after typing stops before searching (timer)
var timer;
searchBox.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
        searchText = searchBox.value.trim().toLowerCase();
        showPlayers();
    }, 200);
});

groupSelect.addEventListener('change', function () {
    selectedGroup = groupSelect.value;
    showPlayers();
});

function ageChanged() {
    if (readAges()) {
        showPlayers();
    }
}
minAgeBox.addEventListener('input', ageChanged);
maxAgeBox.addEventListener('input', ageChanged);

sortSelect.addEventListener('change', function () {
    sortKey = sortSelect.value;
    showPlayers();
});

dirSelect.addEventListener('change', function () {
    sortDir = dirSelect.value;
    showPlayers();
});

favOnlyBox.addEventListener('change', function () {
    favoritesOnly = favOnlyBox.checked;
    showPlayers();
});

clearFavButton.addEventListener('click', function () {
    if (favorites.length === 0) {
        errorText.textContent = 'You have no favorites to clear.';
        return;
    }
    errorText.textContent = '';
    favorites = [];
    saveFavorites();
    for (var i = 0; i < players.length; i++) {
        updateStar(players[i]);
    }
    showPlayers();
});

resetButton.addEventListener('click', function () {
    form.reset();
    errorText.textContent = '';
    minAgeBox.removeAttribute('aria-invalid');
    maxAgeBox.removeAttribute('aria-invalid');
    searchText = '';
    selectedGroup = 'all';
    minAge = null;
    maxAge = null;
    sortKey = 'number';
    sortDir = 'asc';
    favoritesOnly = false;
    sortSelect.value = 'number';
    dirSelect.value = 'asc';
    showPlayers();
});

// pressing Enter in the search box should not reload the page
form.addEventListener('submit', function (event) {
    event.preventDefault();
});

showPlayers();

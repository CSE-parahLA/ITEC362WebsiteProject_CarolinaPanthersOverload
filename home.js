// home.js - homepage: fan poll and sign-up form (both are simulated)

// =====================================================
// FAN POLL
// =====================================================
var players = [
    'Bryce Young (QB)',
    'Tetairoa McMillan (WR)',
    'Jaycee Horn (CB)',
    'Jaelan Phillips (OLB)',
    'Trevor Etienne (RB)'
];

var pollForm = document.getElementById('poll-form');
var pollOptions = document.getElementById('poll-options');
var pollMessage = document.getElementById('poll-message');
var pollResults = document.getElementById('poll-results');
var pollReset = document.getElementById('poll-reset');

// votes is an array of numbers, one per player (same order as players)
var votes = [0, 0, 0, 0, 0];
var hasVoted = false;

// load saved poll from the browser (if there is one)
var saved = localStorage.getItem('cpo-poll');
if (saved !== null) {
    var data = JSON.parse(saved);
    votes = data.votes;
    hasVoted = data.hasVoted;
}

function savePoll() {
    var data = { votes: votes, hasVoted: hasVoted };
    localStorage.setItem('cpo-poll', JSON.stringify(data));
}

// create the radio buttons
function showOptions() {
    pollOptions.innerHTML = '';
    for (var i = 0; i < players.length; i++) {
        var div = document.createElement('div');
        div.className = 'poll-option';

        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'poll';
        radio.id = 'poll-opt-' + i;
        radio.value = i;
        radio.disabled = hasVoted;

        var label = document.createElement('label');
        label.htmlFor = 'poll-opt-' + i;
        label.textContent = players[i];

        div.appendChild(radio);
        div.appendChild(label);
        pollOptions.appendChild(div);
    }
}

// show the vote counts as bars
function showResults() {
    var total = 0;
    for (var i = 0; i < votes.length; i++) {
        total = total + votes[i];
    }

    pollResults.innerHTML = '';
    if (total === 0) {
        pollResults.textContent = 'No votes yet. Be the first to vote!';
        return;
    }

    var title = document.createElement('p');
    title.className = 'status';
    if (total === 1) {
        title.textContent = 'Results (1 vote)';
    } else {
        title.textContent = 'Results (' + total + ' votes)';
    }
    pollResults.appendChild(title);

    for (var j = 0; j < players.length; j++) {
        var percent = Math.round((votes[j] / total) * 100);

        var row = document.createElement('div');
        row.className = 'bar-row';

        var text = document.createElement('div');
        text.textContent = players[j] + ': ' + votes[j] + ' (' + percent + '%)';

        var track = document.createElement('div');
        track.className = 'bar-track';

        var fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = percent + '%';

        track.appendChild(fill);
        row.appendChild(text);
        row.appendChild(track);
        pollResults.appendChild(row);
    }
}

function submitVote(event) {
    event.preventDefault();   // stop the page from reloading
    pollMessage.className = 'error';

    if (hasVoted === true) {
        pollMessage.textContent = 'You already voted. Use "Reset poll" to vote again.';
        return;
    }

    var chosen = pollForm.querySelector('input[name="poll"]:checked');
    if (chosen === null) {
        pollMessage.textContent = 'Please choose a player before voting.';
        return;
    }

    var index = Number(chosen.value);
    votes[index] = votes[index] + 1;
    hasVoted = true;
    savePoll();

    pollMessage.className = 'success';
    pollMessage.textContent = 'Thanks! Your vote for ' + players[index] + ' was counted.';
    showOptions();
    showResults();
}

function resetPoll() {
    votes = [0, 0, 0, 0, 0];
    hasVoted = false;
    savePoll();
    pollMessage.className = 'success';
    pollMessage.textContent = 'Poll reset.';
    showOptions();
    showResults();
}

showOptions();
showResults();
pollForm.addEventListener('submit', submitVote);
pollReset.addEventListener('click', resetPoll);

// =====================================================
// SIGN-UP FORM
// =====================================================
var signupForm = document.getElementById('signup-form');
var nameInput = document.getElementById('signup-name');
var emailInput = document.getElementById('signup-email');
var unitSelect = document.getElementById('signup-unit');
var signupMessage = document.getElementById('signup-message');

// regular expressions
var namePattern = /^[A-Za-z][A-Za-z '.-]{1,39}$/;   // 2 to 40 letters
var emailPattern = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;   // something@something.xx

// shows or clears an error under a field. Returns true if there is no error.
function setError(input, message) {
    var errorText = document.getElementById(input.id + '-error');
    errorText.textContent = message;
    if (message === '') {
        input.removeAttribute('aria-invalid');
        return true;
    }
    input.setAttribute('aria-invalid', 'true');
    return false;
}

function checkName() {
    var value = nameInput.value.trim();
    if (value === '') {
        return setError(nameInput, 'Please enter your name.');
    }
    if (namePattern.test(value) === false) {
        return setError(nameInput, 'Use 2-40 letters only (spaces, apostrophes and hyphens are ok).');
    }
    return setError(nameInput, '');
}

function checkEmail() {
    var value = emailInput.value.trim();
    if (value === '') {
        return setError(emailInput, 'Please enter your email address.');
    }
    if (emailPattern.test(value) === false) {
        return setError(emailInput, 'Enter an email like fan@example.com.');
    }
    return setError(emailInput, '');
}

function checkUnit() {
    if (unitSelect.value === '') {
        return setError(unitSelect, 'Please choose a favorite unit.');
    }
    return setError(unitSelect, '');
}

function submitSignup(event) {
    event.preventDefault();

    // run all three checks so every error shows at once
    var nameOk = checkName();
    var emailOk = checkEmail();
    var unitOk = checkUnit();

    if (nameOk === false || emailOk === false || unitOk === false) {
        signupMessage.className = 'status error';
        signupMessage.textContent = 'Please fix the highlighted fields and try again.';
        return;
    }

    var firstName = nameInput.value.trim().split(' ')[0];
    signupMessage.className = 'status success';
    signupMessage.textContent = 'Thanks, ' + firstName + '! (Simulated) You would now get ' +
        unitSelect.value + ' updates at ' + emailInput.value.trim() + '.';
    signupForm.reset();
}

signupForm.addEventListener('submit', submitSignup);
nameInput.addEventListener('blur', checkName);
emailInput.addEventListener('blur', checkEmail);
unitSelect.addEventListener('change', checkUnit);

const ELECTION_CONFIG = {
  name: "IEEE Student Office Bearer Election",
  roles: {
    Chairman: [
      { name: "A. Harish", dept: "CSE", year: "III" },
      { name: "B. Nivetha", dept: "ECE", year: "III" },
      { name: "C. Pradeep", dept: "IT", year: "III" }
    ],
    "Vice Chairman": [
      { name: "A. Sakthi", dept: "EEE", year: "III" },
      { name: "B. Karthika", dept: "CSE", year: "II" },
      { name: "C. Yazhini", dept: "AIDS", year: "III" }
    ],
    Secretary: [
      { name: "A. Mohammed Irfan", dept: "MECH", year: "III" },
      { name: "B. Meena", dept: "CSE", year: "II" },
      { name: "C. Vishal", dept: "ECE", year: "III" }
    ],
    Treasurer: [
      { name: "A. Sanjana", dept: "IT", year: "III" },
      { name: "B. Rajkumar", dept: "CIVIL", year: "III" },
      { name: "C. Nandhini", dept: "CSE", year: "II" }
    ],
    "Technical Lead": [
      { name: "A. Keerthana", dept: "AIML", year: "III" },
      { name: "B. Dinesh", dept: "CSE", year: "III" },
      { name: "C. Manoj", dept: "IT", year: "II" }
    ]
  }
};

const STORAGE_KEYS = {
  votes: "ieee_vit_votes",
  votedMembers: "ieee_vit_voted_members",
  votedRegNos: "ieee_vit_voted_regnos",
  ballots: "ieee_vit_ballot_log",
  electionState: "ieee_vit_election_state"
};

const voterForm = document.getElementById("voter-form");
const ballotForm = document.getElementById("ballot-form");
const ballotSection = document.getElementById("ballot-section");
const rolesContainer = document.getElementById("roles-container");
const voterMessage = document.getElementById("voter-message");
const ballotMessage = document.getElementById("ballot-message");
const receiptMessage = document.getElementById("receipt-message");
const statsDiv = document.getElementById("stats");
const resultsDiv = document.getElementById("results");
const statusText = document.getElementById("election-status");

const showResultsBtn = document.getElementById("show-results");
const exportResultsBtn = document.getElementById("export-results");
const toggleElectionBtn = document.getElementById("toggle-election");
const resetBtn = document.getElementById("reset-results");

let activeVoter = null;

function getStore(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function setStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isElectionOpen() {
  return getStore(STORAGE_KEYS.electionState, "open") === "open";
}

function updateElectionStatusUI() {
  const open = isElectionOpen();
  statusText.textContent = open ? "Open" : "Closed";
  statusText.className = open ? "badge open" : "badge closed";
  toggleElectionBtn.textContent = open ? "Close Election" : "Open Election";
}

function initializeStorage() {
  if (!getStore(STORAGE_KEYS.votes, null)) {
    setStore(STORAGE_KEYS.votes, ElectionCore.createInitialVotes(ELECTION_CONFIG.roles));
  }

  if (!getStore(STORAGE_KEYS.votedMembers, null)) {
    setStore(STORAGE_KEYS.votedMembers, []);
  }

  if (!getStore(STORAGE_KEYS.votedRegNos, null)) {
    setStore(STORAGE_KEYS.votedRegNos, []);
  }

  if (!getStore(STORAGE_KEYS.ballots, null)) {
    setStore(STORAGE_KEYS.ballots, []);
  }

  if (!getStore(STORAGE_KEYS.electionState, null)) {
    setStore(STORAGE_KEYS.electionState, "open");
  }
}

function createBallot() {
  rolesContainer.innerHTML = "";

  Object.entries(ELECTION_CONFIG.roles).forEach(([role, candidates]) => {
    const group = document.createElement("fieldset");
    group.className = "role-group";

    const legend = document.createElement("legend");
    legend.textContent = role;
    group.appendChild(legend);

    candidates.forEach((candidate) => {
      const option = document.createElement("label");
      option.className = "radio-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = role;
      input.value = candidate.name;
      input.required = true;

      const text = document.createElement("span");
      text.textContent = `${candidate.name} (${candidate.dept}, Year ${candidate.year})`;

      option.appendChild(input);
      option.appendChild(text);
      group.appendChild(option);
    });

    rolesContainer.appendChild(group);
  });
}

function validateVoter(formData) {
  return ElectionCore.validateVoterInput(
    {
      name: formData.get("name"),
      regNo: formData.get("regNo"),
      memberId: formData.get("memberId")
    },
    {
      electionOpen: isElectionOpen(),
      votedMembers: getStore(STORAGE_KEYS.votedMembers, []),
      votedRegNos: getStore(STORAGE_KEYS.votedRegNos, [])
    }
  );
}

function collectSelections(formElement) {
  const selections = {};

  for (const role of Object.keys(ELECTION_CONFIG.roles)) {
    const selected = formElement.querySelector(`input[name="${role}"]:checked`);
    if (!selected) {
      return { ok: false, message: `Please select a candidate for ${role}.` };
    }
    selections[role] = selected.value;
  }

  return { ok: true, selections };
}

function generateReceiptId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `IEEE-${stamp}-${rand}`;
}

function storeVote(voter, selections) {
  const votes = getStore(STORAGE_KEYS.votes, {});
  const updatedVotes = ElectionCore.tallyVotes(votes, selections);

  const votedMembers = getStore(STORAGE_KEYS.votedMembers, []);
  votedMembers.push(ElectionCore.normalize(voter.memberId));

  const votedRegNos = getStore(STORAGE_KEYS.votedRegNos, []);
  votedRegNos.push(ElectionCore.normalize(voter.regNo));

  const ballots = getStore(STORAGE_KEYS.ballots, []);
  const receiptId = generateReceiptId();

  ballots.push({
    receiptId,
    voterName: voter.name,
    regNo: voter.regNo,
    submittedAt: new Date().toISOString(),
    selections
  });

  setStore(STORAGE_KEYS.votes, updatedVotes);
  setStore(STORAGE_KEYS.votedMembers, votedMembers);
  setStore(STORAGE_KEYS.votedRegNos, votedRegNos);
  setStore(STORAGE_KEYS.ballots, ballots);

  return receiptId;
}

function renderStats() {
  const memberCount = getStore(STORAGE_KEYS.votedMembers, []).length;
  const ballotCount = getStore(STORAGE_KEYS.ballots, []).length;
  const electionState = isElectionOpen() ? "Open" : "Closed";

  statsDiv.innerHTML = `
    <div class="stat-card"><strong>${memberCount}</strong><span>Unique Members Voted</span></div>
    <div class="stat-card"><strong>${ballotCount}</strong><span>Total Ballots</span></div>
    <div class="stat-card"><strong>${electionState}</strong><span>Election Status</span></div>
  `;
}

function renderResults() {
  const votes = getStore(STORAGE_KEYS.votes, {});
  resultsDiv.innerHTML = "";

  Object.entries(votes).forEach(([role, candidates]) => {
    const wrapper = document.createElement("div");
    wrapper.className = "result-item";

    const title = document.createElement("h3");
    title.textContent = role;

    const ul = document.createElement("ul");
    const sorted = Object.entries(candidates).sort((a, b) => b[1] - a[1]);
    const winnerScore = sorted[0]?.[1] ?? 0;

    sorted.forEach(([candidate, count]) => {
      const li = document.createElement("li");
      const winnerLabel = count === winnerScore && winnerScore > 0 ? " 🏆" : "";
      li.textContent = `${candidate}: ${count} vote(s)${winnerLabel}`;
      ul.appendChild(li);
    });

    wrapper.appendChild(title);
    wrapper.appendChild(ul);
    resultsDiv.appendChild(wrapper);
  });

  renderStats();
}

function exportResults() {
  const payload = {
    exportedAt: new Date().toISOString(),
    election: ELECTION_CONFIG.name,
    state: getStore(STORAGE_KEYS.electionState, "open"),
    votes: getStore(STORAGE_KEYS.votes, {}),
    turnout: {
      uniqueMembers: getStore(STORAGE_KEYS.votedMembers, []).length,
      ballots: getStore(STORAGE_KEYS.ballots, []).length
    },
    ballots: getStore(STORAGE_KEYS.ballots, [])
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ieee-vit-election-results.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

voterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  voterMessage.textContent = "";

  const formData = new FormData(voterForm);
  const result = validateVoter(formData);

  if (!result.ok) {
    voterMessage.textContent = result.message;
    return;
  }

  activeVoter = result.voter;
  receiptMessage.textContent = "";
  ballotSection.classList.remove("hidden");
  voterMessage.textContent = `Welcome ${activeVoter.name}. Please cast your vote now.`;
  ballotSection.scrollIntoView({ behavior: "smooth" });
});

ballotForm.addEventListener("submit", (event) => {
  event.preventDefault();
  ballotMessage.textContent = "";

  if (!activeVoter) {
    ballotMessage.textContent = "Verify voter details first.";
    return;
  }

  if (!isElectionOpen()) {
    ballotMessage.textContent = "Election closed before submission. Contact admin.";
    return;
  }

  const result = collectSelections(ballotForm);
  if (!result.ok) {
    ballotMessage.textContent = result.message;
    return;
  }

  const receiptId = storeVote(activeVoter, result.selections);
  ballotMessage.textContent = "Ballot submitted successfully.";
  receiptMessage.textContent = `Receipt ID: ${receiptId}`;

  ballotForm.reset();
  voterForm.reset();
  activeVoter = null;
  ballotSection.classList.add("hidden");

  renderResults();
});

showResultsBtn.addEventListener("click", renderResults);
exportResultsBtn.addEventListener("click", exportResults);

toggleElectionBtn.addEventListener("click", () => {
  const nextState = isElectionOpen() ? "closed" : "open";
  setStore(STORAGE_KEYS.electionState, nextState);
  updateElectionStatusUI();
  renderStats();
});

resetBtn.addEventListener("click", () => {
  if (!window.confirm("Reset all election data? This action cannot be undone.")) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  initializeStorage();
  updateElectionStatusUI();

  voterForm.reset();
  ballotForm.reset();
  activeVoter = null;
  ballotSection.classList.add("hidden");

  voterMessage.textContent = "Election data reset completed.";
  ballotMessage.textContent = "";
  receiptMessage.textContent = "";

  renderResults();
});

initializeStorage();
createBallot();
updateElectionStatusUI();
renderResults();

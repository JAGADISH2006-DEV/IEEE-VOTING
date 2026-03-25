const ROLES = {
  Chairman: ["A. Harish", "B. Nivetha", "C. Pradeep"],
  ViceChairman: ["A. Sakthi", "B. Karthika", "C. Yazhini"],
  Secretary: ["A. Mohammed Irfan", "B. Meena", "C. Vishal"],
  Treasurer: ["A. Sanjana", "B. Rajkumar", "C. Nandhini"],
  TechnicalLead: ["A. Keerthana", "B. Dinesh", "C. Manoj"]
};

const STORAGE_KEYS = {
  votes: "ieee_votes",
  votedMembers: "ieee_voted_members"
};

const voterForm = document.getElementById("voter-form");
const ballotForm = document.getElementById("ballot-form");
const ballotSection = document.getElementById("ballot-section");
const rolesContainer = document.getElementById("roles-container");
const voterMessage = document.getElementById("voter-message");
const ballotMessage = document.getElementById("ballot-message");
const resultsDiv = document.getElementById("results");
const showResultsBtn = document.getElementById("show-results");
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

function initializeStorage() {
  const votes = getStore(STORAGE_KEYS.votes, null);
  if (!votes) {
    const initialVotes = {};
    for (const [role, candidates] of Object.entries(ROLES)) {
      initialVotes[role] = {};
      candidates.forEach((candidate) => {
        initialVotes[role][candidate] = 0;
      });
    }
    setStore(STORAGE_KEYS.votes, initialVotes);
  }

  if (!getStore(STORAGE_KEYS.votedMembers, null)) {
    setStore(STORAGE_KEYS.votedMembers, []);
  }
}

function createBallot() {
  rolesContainer.innerHTML = "";

  for (const [role, candidates] of Object.entries(ROLES)) {
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
      input.value = candidate;
      input.required = true;

      option.appendChild(input);
      option.append(candidate);
      group.appendChild(option);
    });

    rolesContainer.appendChild(group);
  }
}

function validateVoter(formData) {
  const name = formData.get("name")?.toString().trim();
  const regNo = formData.get("regNo")?.toString().trim();
  const memberId = formData.get("memberId")?.toString().trim();

  if (!name || !regNo || !memberId) {
    return { ok: false, message: "Please fill all voter details." };
  }

  const votedMembers = getStore(STORAGE_KEYS.votedMembers, []);
  if (votedMembers.includes(memberId.toLowerCase())) {
    return { ok: false, message: "This IEEE Member ID has already cast a vote." };
  }

  return {
    ok: true,
    voter: {
      name,
      regNo,
      memberId: memberId.toLowerCase()
    }
  };
}

function collectSelections(formElement) {
  const selections = {};

  for (const role of Object.keys(ROLES)) {
    const selected = formElement.querySelector(`input[name="${role}"]:checked`);
    if (!selected) {
      return { ok: false, message: `Select a candidate for ${role}.` };
    }
    selections[role] = selected.value;
  }

  return { ok: true, selections };
}

function storeVote(voter, selections) {
  const votes = getStore(STORAGE_KEYS.votes, {});
  Object.entries(selections).forEach(([role, candidate]) => {
    votes[role][candidate] += 1;
  });

  const votedMembers = getStore(STORAGE_KEYS.votedMembers, []);
  votedMembers.push(voter.memberId);

  setStore(STORAGE_KEYS.votes, votes);
  setStore(STORAGE_KEYS.votedMembers, votedMembers);
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

    sorted.forEach(([candidate, count]) => {
      const li = document.createElement("li");
      li.textContent = `${candidate}: ${count} vote(s)`;
      ul.appendChild(li);
    });

    wrapper.appendChild(title);
    wrapper.appendChild(ul);
    resultsDiv.appendChild(wrapper);
  });
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
  ballotSection.classList.remove("hidden");
  voterMessage.textContent = `Welcome ${activeVoter.name}. Please cast your vote.`;
  ballotSection.scrollIntoView({ behavior: "smooth" });
});

ballotForm.addEventListener("submit", (event) => {
  event.preventDefault();
  ballotMessage.textContent = "";

  if (!activeVoter) {
    ballotMessage.textContent = "Verify voter details first.";
    return;
  }

  const result = collectSelections(ballotForm);
  if (!result.ok) {
    ballotMessage.textContent = result.message;
    return;
  }

  storeVote(activeVoter, result.selections);
  ballotMessage.textContent = "Vote submitted successfully. Thank you for participating.";
  ballotForm.reset();
  voterForm.reset();
  activeVoter = null;
  ballotSection.classList.add("hidden");
});

showResultsBtn.addEventListener("click", renderResults);

resetBtn.addEventListener("click", () => {
  if (!window.confirm("Reset all election data? This cannot be undone.")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.votes);
  localStorage.removeItem(STORAGE_KEYS.votedMembers);
  initializeStorage();
  resultsDiv.innerHTML = "";
  voterMessage.textContent = "Election data reset.";
});

initializeStorage();
createBallot();
renderResults();

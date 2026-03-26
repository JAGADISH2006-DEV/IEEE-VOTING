(function attachElectionCore(globalObj) {
  function normalize(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function createInitialVotes(rolesConfig) {
    const votes = {};

    Object.entries(rolesConfig).forEach(([role, candidates]) => {
      votes[role] = {};
      candidates.forEach((candidate) => {
        votes[role][candidate.name] = 0;
      });
    });

    return votes;
  }

  function validateVoterInput(data, options = {}) {
    const {
      electionOpen = true,
      votedMembers = [],
      votedRegNos = []
    } = options;

    if (!electionOpen) {
      return { ok: false, message: "Election is currently closed." };
    }

    const name = String(data.name ?? "").trim();
    const regNo = String(data.regNo ?? "").trim().toUpperCase();
    const memberId = String(data.memberId ?? "").trim();

    if (!name || !regNo || !memberId) {
      return { ok: false, message: "Please fill in all voter details." };
    }

    if (!/^\d{6,12}$/.test(memberId)) {
      return { ok: false, message: "IEEE Member ID should be 6–12 digits." };
    }

    if (!/^[A-Z0-9]{6,15}$/.test(regNo)) {
      return { ok: false, message: "Register number format looks invalid." };
    }

    if (votedMembers.includes(normalize(memberId))) {
      return { ok: false, message: "This IEEE Member ID has already voted." };
    }

    if (votedRegNos.includes(normalize(regNo))) {
      return { ok: false, message: "This Register Number has already voted." };
    }

    return {
      ok: true,
      voter: {
        name,
        regNo,
        memberId
      }
    };
  }

  function tallyVotes(existingVotes, selections) {
    const updatedVotes = JSON.parse(JSON.stringify(existingVotes));

    Object.entries(selections).forEach(([role, candidate]) => {
      if (!updatedVotes[role] || typeof updatedVotes[role][candidate] !== "number") {
        throw new Error(`Invalid role/candidate selection: ${role} -> ${candidate}`);
      }
      updatedVotes[role][candidate] += 1;
    });

    return updatedVotes;
  }

  const api = {
    normalize,
    createInitialVotes,
    validateVoterInput,
    tallyVotes
  };

  globalObj.ElectionCore = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

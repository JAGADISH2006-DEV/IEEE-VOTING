const assert = require('assert');
const core = require('../election-core.js');

(function testCreateInitialVotes() {
  const roles = {
    Chairman: [{ name: 'A' }, { name: 'B' }],
    Secretary: [{ name: 'C' }]
  };

  const votes = core.createInitialVotes(roles);
  assert.deepStrictEqual(votes, {
    Chairman: { A: 0, B: 0 },
    Secretary: { C: 0 }
  });
})();

(function testValidateVoterInputSuccess() {
  const result = core.validateVoterInput(
    { name: 'John', regNo: '23cse101', memberId: '123456' },
    { electionOpen: true, votedMembers: [], votedRegNos: [] }
  );

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.voter.regNo, '23CSE101');
})();

(function testValidateVoterInputDuplicate() {
  const result = core.validateVoterInput(
    { name: 'John', regNo: '23CSE101', memberId: '123456' },
    { electionOpen: true, votedMembers: ['123456'], votedRegNos: [] }
  );

  assert.strictEqual(result.ok, false);
  assert.match(result.message, /already voted/i);
})();

(function testTallyVotes() {
  const votes = {
    Chairman: { A: 1, B: 0 },
    Secretary: { C: 2 }
  };

  const next = core.tallyVotes(votes, { Chairman: 'B', Secretary: 'C' });

  assert.deepStrictEqual(next, {
    Chairman: { A: 1, B: 1 },
    Secretary: { C: 3 }
  });

  assert.deepStrictEqual(votes, {
    Chairman: { A: 1, B: 0 },
    Secretary: { C: 2 }
  });
})();

console.log('All election-core tests passed.');

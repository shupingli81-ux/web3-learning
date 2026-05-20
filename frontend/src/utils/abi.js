export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function delegate(address)",
  "function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32)",
  "function getVotes(address) view returns (uint256)",
  "function nonces(address) view returns (uint256)",
  "function permit(address, address, uint256, uint256, uint8, bytes32, bytes32)"
];

export const GOVERNANCE_ABI = [
  "function name() view returns (string)",
  "function proposalThreshold() view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function quorum(uint256) view returns (uint256)",
  "function state(uint256) view returns (uint8)",
  "function propose(address[], uint256[], bytes[], string) returns (uint256)",
  "function castVote(uint256, uint8)",
  "function castVoteWithReason(uint256, uint8, string)",
  "function execute(address[], uint256[], bytes[], bytes32) payable returns (uint256)",
  "function hashProposal(address[], uint256[], bytes[], bytes32) pure returns (uint256)",
  "function proposalVotes(uint256) view returns (uint256, uint256, uint256)",
  "event ProposalCreated(uint256, address, address[], uint256[], bytes[], string, bytes32)",
  "event VoteCast(address voter, uint256 proposalId, uint8 support, uint256 weight, string reason)"
];

export const TIMELOCK_ABI = [
  "function delay() view returns (uint256)",
  "function GRACE_PERIOD() view returns (uint256)",
  "function acceptQueue(bytes32) view returns (bool)",
  "function execute(address[], uint256[], bytes[], bytes32) payable",
  "function queue(address[], uint256[], bytes[], bytes32) returns (bytes32)"
];

export const PROPOSAL_STATE = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
export const VOTE_TYPE = ["Against", "For", "Abstain"];
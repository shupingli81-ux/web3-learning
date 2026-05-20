import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { PROPOSAL_STATE, VOTE_TYPE } from '../utils/abi'

export default function ProposalDetail({ proposalId, governanceContract, tokenContract, account, onBack }) {
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    if (governanceContract && proposalId) {
      loadProposal()
    }
  }, [governanceContract, proposalId])

  const loadProposal = async () => {
    try {
      const state = await governanceContract.state(proposalId)
      const votes = await governanceContract.proposalVotes(proposalId)
      const delay = await governanceContract.votingDelay()
      const period = await governanceContract.votingPeriod()
      
      // Try to get proposal details from events
      const filter = governanceContract.filters.ProposalCreated()
      const events = await governanceContract.queryFilter(filter, -100)
      const proposalEvent = events.find(e => e.args[0].toString() === proposalId.toString())
      
      let description = ''
      let targets = []
      let values = []
      let calldatas = []
      
      if (proposalEvent) {
        description = proposalEvent.args[5]
        targets = proposalEvent.args[2]
        values = proposalEvent.args[3]
        calldatas = proposalEvent.args[4]
      }

      setProposal({
        id: proposalId,
        state: Number(state),
        votes: {
          against: ethers.utils.formatEther(votes[0]),
          for: ethers.utils.formatEther(votes[1]),
          abstain: ethers.utils.formatEther(votes[2]),
        },
        votingDelay: Number(delay),
        votingPeriod: Number(period),
        description,
        targets,
        values: values.map(v => ethers.utils.formatEther(v)),
        calldatas,
        totalVotes: Number(ethers.utils.formatEther(votes[0])) + 
                    Number(ethers.utils.formatEther(votes[1])) + 
                    Number(ethers.utils.formatEther(votes[2])),
      })
    } catch (err) {
      console.error('Failed to load proposal:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (support) => {
    if (!governanceContract) return
    setVoting(true)
    try {
      const reason = support === 1 ? 'In favor of the proposal' : 
                     support === 0 ? 'Against the proposal' : 'Abstaining from vote'
      const tx = await governanceContract.castVoteWithReason(proposalId, support, reason)
      await tx.wait()
      alert('Vote submitted!')
      loadProposal()
    } catch (err) {
      console.error('Vote failed:', err)
      alert('Vote failed: ' + err.message)
    } finally {
      setVoting(false)
    }
  }

  const getStateColor = (state) => {
    const colors = [
      'bg-gray-500/20 text-gray-400',
      'bg-blue-500/20 text-blue-400',
      'bg-gray-500/20 text-gray-400',
      'bg-red-500/20 text-red-400',
      'bg-green-500/20 text-green-400',
      'bg-yellow-500/20 text-yellow-400',
      'bg-gray-500/20 text-gray-400',
      'bg-purple-500/20 text-purple-400',
    ]
    return colors[state] || 'bg-gray-500/20 text-gray-400'
  }

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`
    if (seconds < 3600) return `${Math.floor(seconds/60)} minutes`
    if (seconds < 86400) return `${Math.floor(seconds/3600)} hours`
    return `${Math.floor(seconds/86400)} days`
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>
  if (!proposal) return <div className="text-center py-10 text-gray-400">Proposal not found</div>

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        ← Back to Proposals
      </button>

      <div className="rounded-xl bg-white/5 p-6 backdrop-blur">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <span className="text-sm text-gray-400">Proposal #{proposal.id.toString().slice(0, 10)}...</span>
            <h2 className="mt-1 text-2xl font-bold">{proposal.description || 'Untitled Proposal'}</h2>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-medium ${getStateColor(proposal.state)}`}>
            {PROPOSAL_STATE[proposal.state]}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white/5 p-4 text-center">
            <div className="text-sm text-gray-400">Against</div>
            <div className="mt-1 text-2xl font-bold text-red-400">{proposal.votes.against}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4 text-center">
            <div className="text-sm text-gray-400">For</div>
            <div className="mt-1 text-2xl font-bold text-green-400">{proposal.votes.for}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4 text-center">
            <div className="text-sm text-gray-400">Abstain</div>
            <div className="mt-1 text-2xl font-bold text-gray-400">{proposal.votes.abstain}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4 text-center">
            <div className="text-sm text-gray-400">Total Votes</div>
            <div className="mt-1 text-2xl font-bold text-blue-400">{proposal.totalVotes.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-white/5 p-3">
            <span className="text-gray-400">Voting Delay: </span>
            <span className="font-medium">{formatTime(proposal.votingDelay)}</span>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <span className="text-gray-400">Voting Period: </span>
            <span className="font-medium">{formatTime(proposal.votingPeriod)}</span>
          </div>
        </div>

        {proposal.state === 1 && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => handleVote(1)}
              disabled={voting}
              className="flex-1 rounded-lg bg-green-600 py-3 font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              ✓ Vote For
            </button>
            <button
              onClick={() => handleVote(0)}
              disabled={voting}
              className="flex-1 rounded-lg bg-red-600 py-3 font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              ✗ Vote Against
            </button>
            <button
              onClick={() => handleVote(2)}
              disabled={voting}
              className="flex-1 rounded-lg bg-gray-600 py-3 font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              ○ Abstain
            </button>
          </div>
        )}

        {proposal.state !== 1 && proposal.state !== 0 && (
          <div className="mt-6 rounded-lg bg-white/5 p-4 text-center text-gray-400">
            Voting is {proposal.state === 4 ? 'succeeded' : proposal.state === 3 ? 'defeated' : 'not active'}
          </div>
        )}
      </div>

      {proposal.targets.length > 0 && (
        <div className="rounded-xl bg-white/5 p-6 backdrop-blur">
          <h3 className="mb-4 text-lg font-bold">Actions ({proposal.targets.length})</h3>
          <div className="space-y-3">
            {proposal.targets.map((target, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Action #{index + 1}</span>
                  <span className="text-sm font-medium">{proposal.values[index]} ETH</span>
                </div>
                <div className="mt-2 truncate text-sm text-blue-400">
                  → {target}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
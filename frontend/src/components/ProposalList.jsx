import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { PROPOSAL_STATE, VOTE_TYPE } from '../utils/abi'
import ProposalDetail from './ProposalDetail'

export default function ProposalList({ governanceContract, tokenContract, account, chainId }) {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState(null)

  useEffect(() => {
    if (governanceContract) {
      loadProposals()
      governanceContract.on('ProposalCreated', () => loadProposals())
    }
    return () => {
      if (governanceContract) {
        governanceContract.removeAllListeners('ProposalCreated')
      }
    }
  }, [governanceContract])

  const loadProposals = async () => {
    if (!governanceContract) return
    
    try {
      const filter = governanceContract.filters.ProposalCreated()
      const events = await governanceContract.queryFilter(filter, -100)
      
      const proposalData = await Promise.all(
        events.map(async (event) => {
          const id = event.args[0]
          const state = await governanceContract.state(id)
          const votes = await governanceContract.proposalVotes(id)
          const proposer = event.args[1]
          const description = event.args[5]
          
          return {
            id: id.toString(),
            proposer,
            description: description.split('\n')[0].slice(0, 100),
            state: Number(state),
            votes: {
              against: Number(ethers.utils.formatEther(votes[0])),
              for: Number(ethers.utils.formatEther(votes[1])),
              abstain: Number(ethers.utils.formatEther(votes[2])),
            },
            timestamp: event.blockNumber,
          }
        })
      )
      
      setProposals(proposalData.reverse())
    } catch (err) {
      console.error('Failed to load proposals:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStateColor = (state) => {
    const colors = [
      'text-gray-400', 'text-blue-400', 'text-gray-400', 'text-red-400',
      'text-green-400', 'text-yellow-400', 'text-gray-400', 'text-purple-400',
    ]
    return colors[state] || 'text-gray-400'
  }

  if (selectedProposal) {
    return (
      <ProposalDetail
        proposalId={selectedProposal}
        governanceContract={governanceContract}
        tokenContract={tokenContract}
        account={account}
        onBack={() => setSelectedProposal(null)}
      />
    )
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Loading proposals...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Proposals</h2>
        <span className="text-gray-400">{proposals.length} total</span>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-xl bg-white/5 p-8 text-center">
          <p className="text-gray-400">No proposals yet. Create the first one!</p>
        </div>
      ) : (
        proposals.map((proposal) => {
          const totalVotes = proposal.votes.against + proposal.votes.for + proposal.votes.abstain
          const forPercent = totalVotes > 0 ? (proposal.votes.for / totalVotes * 100).toFixed(1) : 0
          
          return (
            <div
              key={proposal.id}
              onClick={() => setSelectedProposal(proposal.id)}
              className="rounded-xl bg-white/5 p-6 cursor-pointer hover:bg-white/10 transition-colors backdrop-blur"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="text-sm text-gray-400">#{proposal.id.slice(0, 8)}</span>
                  <h3 className="mt-1 text-lg font-semibold">{proposal.description}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                  </p>
                </div>
                <span className={`font-medium ${getStateColor(proposal.state)}`}>
                  {PROPOSAL_STATE[proposal.state]}
                </span>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${forPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-400">
                <span>🔴 {proposal.votes.against.toFixed(2)} Against</span>
                <span>🟢 {proposal.votes.for.toFixed(2)} For</span>
                <span>⚪ {proposal.votes.abstain.toFixed(2)} Abstain</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
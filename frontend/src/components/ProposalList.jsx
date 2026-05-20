import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { PROPOSAL_STATE } from '../utils/abi'

export default function ProposalList({ governanceContract, tokenContract, account, chainId }) {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState('all')

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
            description: description.split('\n')[0].slice(0, 120),
            fullDescription: description,
            state: Number(state),
            votes: {
              against: Number(ethers.utils.formatEther(votes[0])),
              for: Number(ethers.utils.formatEther(votes[1])),
              abstain: Number(ethers.utils.formatEther(votes[2])),
            },
            blockNumber: event.blockNumber,
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

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.includes(searchTerm)
    const matchesState = filterState === 'all' || p.state === Number(filterState)
    return matchesSearch && matchesState
  })

  const getStateColor = (state) => {
    const colors = [
      'text-gray-400', 'text-blue-400', 'text-gray-400', 'text-red-400',
      'text-green-400', 'text-yellow-400', 'text-gray-400', 'text-purple-400',
    ]
    return colors[state] || 'text-gray-400'
  }

  if (selectedProposal) {
    const ProposalDetail = require('./ProposalDetail').default
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
        <span className="text-gray-400">{filteredProposals.length} / {proposals.length}</span>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search proposals by title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-gray-700 py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="rounded-lg bg-white/5 border border-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All States</option>
          <option value="1">Active</option>
          <option value="4">Succeeded</option>
          <option value="3">Defeated</option>
          <option value="0">Pending</option>
          <option value="7">Executed</option>
        </select>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All', value: 'all' },
          { label: '🔴 Active', value: '1' },
          { label: '🟢 Succeeded', value: '4' },
          { label: '⚫ Defeated', value: '3' },
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setFilterState(filter.value)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              filterState === filter.value
                ? 'bg-blue-500/30 text-blue-300'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredProposals.length === 0 ? (
        <div className="rounded-xl bg-white/5 p-8 text-center">
          <p className="text-gray-400">
            {searchTerm || filterState !== 'all' 
              ? 'No proposals match your search.' 
              : 'No proposals yet. Create the first one!'}
          </p>
        </div>
      ) : (
        filteredProposals.map((proposal) => {
          const totalVotes = proposal.votes.against + proposal.votes.for + proposal.votes.abstain
          const forPercent = totalVotes > 0 ? (proposal.votes.for / totalVotes * 100) : 50
          
          return (
            <div
              key={proposal.id}
              onClick={() => setSelectedProposal(proposal.id)}
              className="rounded-xl bg-white/5 p-6 cursor-pointer hover:bg-white/10 transition-all backdrop-blur group"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">#{proposal.id.slice(0, 8)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStateColor(proposal.state)} bg-current/10`}>
                      {PROPOSAL_STATE[proposal.state]}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold group-hover:text-blue-400 transition-colors">
                    {proposal.description || 'Untitled Proposal'}
                  </h3>
                </div>
                <span className="text-gray-500 text-sm">
                  {proposal.blockNumber && `#${proposal.blockNumber}`}
                </span>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-700/50">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all"
                  style={{ width: `${forPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>🔴 {proposal.votes.against.toFixed(1)}</span>
                <span className="text-center text-gray-300">
                  {totalVotes > 0 ? `${forPercent.toFixed(1)}% For` : 'No votes yet'}
                </span>
                <span>🟢 {proposal.votes.for.toFixed(1)}</span>
              </div>

              <div className="mt-3 flex justify-between text-xs text-gray-500">
                <span>by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
                <span className="group-hover:text-blue-400">View details →</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
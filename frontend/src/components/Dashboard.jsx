import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export default function Dashboard({ governanceContract, tokenContract, account }) {
  const [stats, setStats] = useState({
    totalSupply: '0',
    yourBalance: '0',
    yourVotes: '0',
    totalProposals: '0',
    activeProposals: '0',
    totalVotes: '0',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (governanceContract && tokenContract) {
      loadStats()
    }
  }, [governanceContract, tokenContract])

  const loadStats = async () => {
    try {
      const [totalSupply, balance, votes, proposals] = await Promise.all([
        tokenContract.totalSupply(),
        tokenContract.balanceOf(account),
        tokenContract.getVotes(account),
        governanceContract ? governanceContract.proposalCount?.() : Promise.resolve(0),
      ])

      // Get proposal states
      let activeCount = 0
      let totalVotes = 0
      let proposalCount = 0
      
      if (governanceContract) {
        const filter = governanceContract.filters.ProposalCreated()
        const events = await governanceContract.queryFilter(filter, -100)
        proposalCount = events.length
        
        for (const event of events) {
          const id = event.args[0]
          const state = await governanceContract.state(id)
          if (Number(state) === 1) activeCount++ // Active
          
          const voteData = await governanceContract.proposalVotes(id)
          totalVotes += Number(ethers.utils.formatEther(voteData[0]))
          totalVotes += Number(ethers.utils.formatEther(voteData[1]))
          totalVotes += Number(ethers.utils.formatEther(voteData[2]))
        }
      }

      setStats({
        totalSupply: Number(ethers.utils.formatEther(totalSupply)).toLocaleString(),
        yourBalance: Number(ethers.utils.formatEther(balance)).toLocaleString(),
        yourVotes: Number(ethers.utils.formatEther(votes)).toLocaleString(),
        totalProposals: proposalCount.toString(),
        activeProposals: activeCount.toString(),
        totalVotes: totalVotes.toFixed(2),
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelegate = async () => {
    try {
      const tx = await tokenContract.delegate(account)
      await tx.wait()
      alert('Votes delegated successfully!')
      loadStats()
    } catch (err) {
      console.error('Delegate failed:', err)
      alert('Failed to delegate: ' + err.message)
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Loading stats...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 DAO Statistics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Token Supply"
          value={stats.totalSupply}
          suffix=" FDT"
          icon="🪙"
          color="blue"
        />
        <StatCard
          title="Your Token Balance"
          value={stats.yourBalance}
          suffix=" FDT"
          icon="👛"
          color="green"
        />
        <StatCard
          title="Your Voting Power"
          value={stats.yourVotes}
          suffix=" votes"
          icon="🗳️"
          color={Number(stats.yourVotes) > 0 ? 'green' : 'yellow'}
        />
        <StatCard
          title="Total Proposals"
          value={stats.totalProposals}
          icon="📝"
          color="purple"
        />
        <StatCard
          title="Active Proposals"
          value={stats.activeProposals}
          icon="⚡"
          color="orange"
        />
        <StatCard
          title="Total Votes Cast"
          value={stats.totalVotes}
          icon="✅"
          color="cyan"
        />
      </div>

      {Number(stats.yourVotes) === 0 && (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-bold text-yellow-300">No Voting Power</h3>
              <p className="mt-1 text-sm text-gray-300">
                You have FDT tokens but no voting power. Token balances don't automatically count for voting — you must delegate your votes to yourself.
              </p>
              <button
                onClick={handleDelegate}
                className="mt-4 rounded-lg bg-yellow-600 px-4 py-2 font-medium hover:bg-yellow-700 transition-colors"
              >
                Delegate to Myself
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white/5 p-6">
        <h3 className="mb-4 font-bold">How Governance Works</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { step: '1', title: 'Create', desc: 'Anyone with 1+ FDT can create a proposal' },
            { step: '2', title: 'Vote', desc: '3-day voting period for all token holders' },
            { step: '3', title: 'Queue', desc: '2-day timelock after successful vote' },
            { step: '4', title: 'Execute', desc: 'Proposal actions are executed on-chain' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-xl font-bold text-blue-400">
                {item.step}
              </div>
              <h4 className="mt-2 font-medium">{item.title}</h4>
              <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, suffix = '', icon, color }) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  }
  
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors[color]} border p-6 backdrop-blur`}>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="mt-2 text-3xl font-bold">
        {value}<span className="text-lg text-gray-400">{suffix}</span>
      </div>
    </div>
  )
}
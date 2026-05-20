import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export default function Profile({ tokenContract, governanceContract, account }) {
  const [profile, setProfile] = useState({
    balance: '0',
    votes: '0',
    delegatedTo: null,
    proposalsCreated: 0,
    votesCast: 0,
  })
  const [loading, setLoading] = useState(true)
  const [delegateAddress, setDelegateAddress] = useState('')
  const [delegating, setDelegating] = useState(false)

  useEffect(() => {
    if (tokenContract && account) {
      loadProfile()
    }
  }, [tokenContract, account])

  const loadProfile = async () => {
    try {
      const [balance, votes] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.getVotes(account),
      ])

      // Count proposals created by this account
      let proposalsCreated = 0
      let votesCast = 0
      
      if (governanceContract) {
        const filter = governanceContract.filters.ProposalCreated()
        const events = await governanceContract.queryFilter(filter, -100)
        proposalsCreated = events.filter(e => e.args[1].toLowerCase() === account.toLowerCase()).length
        
        // Count votes (from VoteCast events)
        const voteFilter = governanceContract.filters.VoteCast()
        const voteEvents = await governanceContract.queryFilter(voteFilter, -100)
        votesCast = voteEvents.filter(e => e.args[0].toLowerCase() === account.toLowerCase()).length
      }

      setProfile({
        balance: Number(ethers.utils.formatEther(balance)).toLocaleString(),
        votes: Number(ethers.utils.formatEther(votes)).toLocaleString(),
        delegatedTo: null, // Would need to track delegation
        proposalsCreated,
        votesCast,
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelegate = async (toAddress = null) => {
    if (!tokenContract) return
    setDelegating(true)
    try {
      const target = toAddress || delegateAddress || account
      const tx = await tokenContract.delegate(target)
      await tx.wait()
      alert(`Successfully delegated to ${toAddress ? 'external address' : 'yourself'}!`)
      setDelegateAddress('')
      loadProfile()
    } catch (err) {
      console.error('Delegate failed:', err)
      alert('Failed to delegate: ' + err.message)
    } finally {
      setDelegating(false)
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Loading profile...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">👤 Your Profile</h2>

      {/* Profile Card */}
      <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 border border-blue-500/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
            {account?.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <div className="text-sm text-gray-400">Connected Wallet</div>
            <div className="font-mono text-sm">{account}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white/5 p-4">
            <div className="text-sm text-gray-400">Token Balance</div>
            <div className="text-2xl font-bold text-blue-400">{profile.balance} FDT</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <div className="text-sm text-gray-400">Voting Power</div>
            <div className="text-2xl font-bold text-green-400">{profile.votes} votes</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-6 text-center">
          <div className="text-3xl font-bold text-blue-400">{profile.proposalsCreated}</div>
          <div className="text-sm text-gray-400">Proposals Created</div>
        </div>
        <div className="rounded-xl bg-white/5 p-6 text-center">
          <div className="text-3xl font-bold text-green-400">{profile.votesCast}</div>
          <div className="text-sm text-gray-400">Votes Cast</div>
        </div>
        <div className="rounded-xl bg-white/5 p-6 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {profile.balance > 0 ? ((Number(profile.votes) / Number(profile.balance.replace(/,/g, '')) * 100).toFixed(1)) : 0}%
          </div>
          <div className="text-sm text-gray-400">Voting Power Activated</div>
        </div>
      </div>

      {/* Delegate Section */}
      <div className="rounded-xl bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-bold">🗳️ Delegation</h3>
        
        {Number(profile.votes) === 0 && (
          <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
            <p className="text-yellow-300 text-sm">
              ⚠️ You have no voting power. Delegates your tokens to activate voting rights.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter address to delegate to (0x...)"
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              className="flex-1 rounded-lg bg-white/5 border border-gray-700 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => handleDelegate()}
              disabled={delegating || !delegateAddress}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {delegating ? 'Delegating...' : 'Delegate'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleDelegate(account)}
              disabled={delegating || Number(profile.votes) > 0}
              className="flex-1 rounded-lg bg-green-600/20 border border-green-500/30 px-4 py-3 text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors"
            >
              ✅ Delegate to Myself
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          💡 Delegating does NOT lock your tokens. You can transfer them at any time.
        </p>
      </div>

      {/* Network Info */}
      <div className="rounded-xl bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-bold">🔗 Network Information</h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Network</span>
            <span className="font-medium">Sepolia Testnet (Chain ID: 11155111)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Explorer</span>
            <a 
              href={`https://sepolia.etherscan.io/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View on Etherscan →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
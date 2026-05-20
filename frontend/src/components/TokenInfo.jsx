import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export default function TokenInfo({ tokenContract, account }) {
  const [info, setInfo] = useState({ name: '', symbol: '', totalSupply: '', balance: '', votes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tokenContract && account) {
      loadInfo()
    }
  }, [tokenContract, account])

  const loadInfo = async () => {
    try {
      const [name, symbol, totalSupply, balance, votes] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.totalSupply(),
        tokenContract.balanceOf(account),
        tokenContract.getVotes(account),
      ])
      setInfo({
        name,
        symbol,
        totalSupply: ethers.utils.formatUnits(totalSupply, 18),
        balance: ethers.utils.formatUnits(balance, 18),
        votes: ethers.utils.formatUnits(votes, 18),
      })
    } catch (err) {
      console.error('Failed to load token info:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelegate = async () => {
    try {
      const tx = await tokenContract.delegate(account)
      await tx.wait()
      alert('Successfully delegated votes to yourself!')
      loadInfo()
    } catch (err) {
      console.error('Delegate failed:', err)
      alert('Delegate failed: ' + err.message)
    }
  }

  if (loading) return <div className="text-center text-gray-400">Loading...</div>

  return (
    <div className="rounded-xl bg-white/5 p-6 backdrop-blur">
      <h2 className="mb-6 text-2xl font-bold">{info.name} ({info.symbol})</h2>
      
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-sm text-gray-400">Total Supply</div>
          <div className="text-xl font-bold">{Number(info.totalSupply).toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-sm text-gray-400">Your Balance</div>
          <div className="text-xl font-bold">{Number(info.balance).toLocaleString()} {info.symbol}</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-sm text-gray-400">Your Voting Power</div>
          <div className="text-xl font-bold">{Number(info.votes).toLocaleString()} votes</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-sm text-gray-400">Status</div>
          <div className={`text-xl font-bold ${Number(info.votes) > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
            {Number(info.votes) > 0 ? 'Can Vote' : 'Delegate to activate'}
          </div>
        </div>
      </div>

      {Number(info.votes) === 0 && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 mb-4">
          <p className="text-yellow-300 mb-4">
            ⚠️ You have no voting power. Token balances don't count automatically — you must delegate to yourself to activate voting power.
          </p>
          <button
            onClick={handleDelegate}
            className="rounded-lg bg-yellow-600 px-4 py-2 font-medium hover:bg-yellow-700 transition-colors"
          >
            Delegate to Myself
          </button>
        </div>
      )}
      
      <p className="text-sm text-gray-400">
        Delegating does not lock your tokens. You can still transfer them at any time.
      </p>
    </div>
  )
}
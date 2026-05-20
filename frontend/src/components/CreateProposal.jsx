import { useState } from 'react'

export default function CreateProposal({ governanceContract, tokenContract, account }) {
  const [targets, setTargets] = useState([''])
  const [values, setValues] = useState(['0'])
  const [calldatas, setCalldatas] = useState(['0x'])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const addTransaction = () => {
    setTargets([...targets, ''])
    setValues([...values, '0'])
    setCalldatas([...calldatas, '0x'])
  }

  const removeTransaction = (index) => {
    if (targets.length > 1) {
      setTargets(targets.filter((_, i) => i !== index))
      setValues(values.filter((_, i) => i !== index))
      setCalldatas(calldatas.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!governanceContract || !tokenContract) return
    
    setLoading(true)
    try {
      // Check voting power
      const votes = await tokenContract.getVotes(account)
      const threshold = await governanceContract.proposalThreshold()
      
      if (votes < threshold) {
        alert(`You need at least ${ethers.utils.formatUnits(threshold, 18)} FDT to create a proposal.`)
        return
      }

      const descriptionHash = ethers.utils.id(description)
      const tx = await governanceContract.propose(
        targets.map(t => t || '0x0000000000000000000000000000000000000000'),
        values.map(v => ethers.utils.parseEther(v || '0')),
        calldatas,
        description
      )
      
      alert('Proposal created! Waiting for confirmation...')
      await tx.wait()
      alert('✅ Proposal created successfully!')
      setTargets([''])
      setValues(['0'])
      setCalldatas(['0x'])
      setDescription('')
    } catch (err) {
      console.error('Create proposal failed:', err)
      alert('Failed to create proposal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-white/5 p-6 backdrop-blur">
      <h2 className="mb-6 text-2xl font-bold">Create New Proposal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Proposal Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your proposal..."
            className="w-full rounded-lg bg-white/5 border border-gray-700 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            rows={4}
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Transactions</label>
            <button
              type="button"
              onClick={addTransaction}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + Add Transaction
            </button>
          </div>
          
          <div className="space-y-3">
            {targets.map((_, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-4">
                <div className="mb-3 text-sm text-gray-400">Transaction {index + 1}</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    placeholder="Target address (0x...)"
                    value={targets[index]}
                    onChange={(e) => {
                      const newTargets = [...targets]
                      newTargets[index] = e.target.value
                      setTargets(newTargets)
                    }}
                    className="rounded bg-white/5 border border-gray-700 p-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    placeholder="Value (ETH)"
                    value={values[index]}
                    onChange={(e) => {
                      const newValues = [...values]
                      newValues[index] = e.target.value
                      setValues(newValues)
                    }}
                    className="rounded bg-white/5 border border-gray-700 p-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Calldata (0x...)"
                      value={calldatas[index]}
                      onChange={(e) => {
                        const newCalldatas = [...calldatas]
                        newCalldatas[index] = e.target.value
                        setCalldatas(newCalldatas)
                      }}
                      className="flex-1 rounded bg-white/5 border border-gray-700 p-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    {targets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTransaction(index)}
                        className="rounded bg-red-500/20 px-3 text-red-400 hover:bg-red-500/30"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !description}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Submit Proposal'}
        </button>
      </form>
    </div>
  )
}
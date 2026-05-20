import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACTS } from './utils/contracts'
import { TOKEN_ABI, GOVERNANCE_ABI, PROPOSAL_STATE, VOTE_TYPE } from './utils/abi'
import Header from './components/Header'
import WalletConnect from './components/WalletConnect'
import TokenInfo from './components/TokenInfo'
import CreateProposal from './components/CreateProposal'
import ProposalList from './components/ProposalList'
import Profile from './components/Profile'
import Dashboard from './components/Dashboard'
import { ToastContainer } from './components/Toast'

function App() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [tokenContract, setTokenContract] = useState(null)
  const [governanceContract, setGovernanceContract] = useState(null)
  const [activeTab, setActiveTab] = useState('proposals')
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      setAccount(accounts[0])
      initContracts(accounts[0])
    }
  }

  const handleChainChanged = (chainIdHex) => {
    setChainId(parseInt(chainIdHex, 16))
    if (account) initContracts(account)
  }

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const account = await signer.getAddress()
      const network = await provider.getNetwork()
      
      setProvider(provider)
      setSigner(signer)
      setAccount(account)
      setChainId(Number(network.chainId))
      
      initContractsWithSigner(provider, signer, Number(network.chainId))
    } catch (err) {
      console.error('Connection failed:', err)
    }
  }

  const disconnect = () => {
    setProvider(null)
    setSigner(null)
    setAccount(null)
    setTokenContract(null)
    setGovernanceContract(null)
  }

  const initContractsWithSigner = (provider, signer, chainId) => {
    const contracts = CONTRACTS[chainId]
    if (!contracts) {
      alert('Unsupported network. Please switch to Hardhat localhost or Sepolia.')
      return
    }
    setTokenContract(new ethers.Contract(contracts.token, TOKEN_ABI, signer))
    setGovernanceContract(new ethers.Contract(contracts.governance, GOVERNANCE_ABI, signer))
  }

  const initContracts = async (account) => {
    if (!provider || !chainId) return
    const contracts = CONTRACTS[chainId]
    if (!contracts) return
    const signer = await provider.getSigner()
    setTokenContract(new ethers.Contract(contracts.token, TOKEN_ABI, signer))
    setGovernanceContract(new ethers.Contract(contracts.governance, GOVERNANCE_ABI, signer))
  }

  return (
    <div className="min-h-screen text-white">
      <Header account={account} onConnect={connect} onDisconnect={disconnect} />
      
      <main className="container mx-auto px-4 py-8">
        {!account ? (
          <WalletConnect onConnect={connect} />
        ) : (
          <>
            <div className="mb-6 flex gap-4 border-b border-gray-700">
              {['dashboard', 'proposals', 'create', 'profile', 'token'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 capitalize transition-colors ${
                    activeTab === tab 
                      ? 'border-b-2 border-blue-500 text-blue-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'create' ? 'New Proposal' : tab === 'profile' ? '👤 Profile' : tab}
                </button>
              ))}
            </div>

            <div className="grid gap-6">
              {activeTab === 'dashboard' && (
                <Dashboard
                  governanceContract={governanceContract}
                  tokenContract={tokenContract}
                  account={account}
                />
              )}
              {activeTab === 'proposals' && (
                <ProposalList 
                  governanceContract={governanceContract}
                  tokenContract={tokenContract}
                  account={account}
                  chainId={chainId}
                />
              )}
              {activeTab === 'create' && (
                <CreateProposal 
                  governanceContract={governanceContract}
                  tokenContract={tokenContract}
                  account={account}
                />
              )}
              {activeTab === 'profile' && (
                <Profile
                  tokenContract={tokenContract}
                  governanceContract={governanceContract}
                  account={account}
                />
              )}
              {activeTab === 'token' && (
                <TokenInfo 
                  tokenContract={tokenContract}
                  account={account}
                />
              )}
            </div>
          </>
        )}
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default App
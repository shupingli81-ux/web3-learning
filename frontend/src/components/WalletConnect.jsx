export default function WalletConnect({ onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Focus DAO
        </h1>
        <p className="text-xl text-gray-400">
          Decentralized Governance for the Future
        </p>
      </div>
      
      <div className="mb-8 text-center">
        <p className="mb-6 text-gray-300">
          Connect your wallet to participate in DAO governance.<br/>
          Create proposals, vote on decisions, and shape the future.
        </p>
        
        <div className="mb-6 grid grid-cols-3 gap-4 text-center">
          {[
            { title: '100K', subtitle: 'Token Holders' },
            { title: '3 Days', subtitle: 'Voting Period' },
            { title: '4%', subtitle: 'Quorum' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg bg-white/5 p-4">
              <div className="text-2xl font-bold text-blue-400">{stat.title}</div>
              <div className="text-sm text-gray-400">{stat.subtitle}</div>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={onConnect}
        className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-bold transition-transform hover:scale-105"
      >
        Connect Wallet to Get Started
      </button>
    </div>
  )
}
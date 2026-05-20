export default function Header({ account, onConnect, onDisconnect }) {
  return (
    <header className="border-b border-gray-800 bg-black/20 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
            F
          </div>
          <span className="text-xl font-bold">Focus DAO</span>
        </div>
        
        <div>
          {account ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <button
                onClick={onDisconnect}
                className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400 hover:bg-red-500/30"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
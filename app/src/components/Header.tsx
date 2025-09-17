interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <img src="/alest-logo.png" alt="Alest Consultoria" className="h-8 sm:h-10 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">AI Voice Platform</h1>
            <p className="text-xs sm:text-sm text-gray-300 hidden sm:block lg:block">Conecte provedores. Orquestre ações. Tudo em uma única conversa.</p>
            <p className="text-xs text-gray-300 block sm:hidden">Conecte provedores</p>
          </div>
        </div>
        
        <div className="flex items-center ml-2 sm:ml-4">
          {/* Ícone do menu hambúrguer - Design original Alest */}
          <button
            onClick={onMenuClick}
            className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-shrink-0"
            aria-label="Abrir menu de configuração"
            style={{ minWidth: '40px', minHeight: '40px' }}
          >
            <div className="flex flex-col space-y-0.5 sm:space-y-1 items-center justify-center">
              <div className="w-4 sm:w-6 h-0.5 bg-white rounded"></div>
              <div className="w-4 sm:w-6 h-0.5 bg-white rounded"></div>
              <div className="w-4 sm:w-6 h-0.5 bg-white rounded"></div>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

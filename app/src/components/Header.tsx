interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-8 py-4 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/alest-logo.png" alt="Alest Consultoria" className="h-10" />
          <div>
            <h1 className="text-2xl font-bold text-white">Personal Agent</h1>
            <p className="text-gray-300">Conecte provedores. Orquestre ações. Tudo em uma única conversa.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Ícone do menu hambúrguer - Design original Alest */}
          <button
            onClick={onMenuClick}
            className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            aria-label="Abrir menu de configuração"
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <div className="flex flex-col space-y-1 items-center justify-center">
              <div className="w-6 h-0.5 bg-white rounded"></div>
              <div className="w-6 h-0.5 bg-white rounded"></div>
              <div className="w-6 h-0.5 bg-white rounded"></div>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

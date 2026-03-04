import { useNavigate } from 'react-router-dom';
import cardozoLogo from '../assets/cardozo-logo.png';
export default function Header({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center gap-6 text-sm text-gray-600">
            <span>Students</span>
            <span>Alumni</span>
            <span>About</span>
            <span>Give</span>
            <span>Library</span>
            <span>Calendars</span>
            <span>Canvas</span>
            <span>Luminis</span>
            <span>DIRECTORY</span>
            <span>SEARCH</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-cardozo-blue shadow-nav">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div 
              className="flex items-center gap-4 cursor-pointer" 
              onClick={() => navigate('/dashboard')}
            >
              <img 
                src={cardozoLogo} 
                alt="Cardozo Law - 50 Years of Daring Daily" 
                className="h-12"
              />
            </div>
            
            {user && (
              <div className="flex items-center gap-6 text-white text-sm">
                <div className="text-right">
                  <div className="font-medium">{user.email}</div>
                  <div className="text-xs text-gray-300 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
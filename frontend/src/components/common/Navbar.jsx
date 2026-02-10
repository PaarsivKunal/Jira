import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Settings,
  Search,
  Plus,
  HelpCircle,
  LogOut,
  User,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import AppsDropdown from './AppsDropdown';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-top">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-2"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4 sm:space-x-8 flex-1 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <AppsDropdown />
              <Link to="/dashboard" className="flex items-center space-x-2 min-w-0">
                <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base">P</span>
                </div>
                <span className="text-base sm:text-lg font-semibold text-gray-900 truncate">Paarsiv</span>
              </Link>
            </div>
            <div className="hidden lg:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Your work
              </Link>
              <Link
                to="/projects"
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Projects
              </Link>
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Filters
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Dashboards
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Teams
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Plans
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Apps
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button className="px-2 sm:px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-1 sm:space-x-2 text-sm font-medium transition-colors">
              <Plus size={16} />
              <span className="hidden sm:inline">Create</span>
            </button>
            <div className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-48 lg:w-64 text-sm"
              />
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings size={20} />
              </button>
              <button className="hidden md:block p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <HelpCircle size={20} />
              </button>
              {user && (
                <div className="relative ml-2" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:bg-primary-700 transition-colors">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`hidden sm:block text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                              {user.role?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/account-details"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                        >
                          <User size={16} />
                          <span>Account settings</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                        >
                          <Settings size={16} />
                          <span>Integrations</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full mt-1"
                        >
                          <LogOut size={16} />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

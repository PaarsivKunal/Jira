import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Plus, X, Users } from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ isCollapsed, onToggle, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then((res) => res.data),
  });

  // Extract projects array from paginated response
  const projects = Array.isArray(projectsResponse?.data) 
    ? projectsResponse.data 
    : Array.isArray(projectsResponse) 
    ? projectsResponse 
    : [];

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white border-r border-gray-200 min-h-screen flex flex-col items-center py-4 safe-top safe-bottom">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-4"
          title="Expand sidebar"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
        {projects.slice(0, 3).map((project) => {
          const isActive = location.pathname === `/projects/${project._id}/board`;
          return (
            <Link
              key={project._id}
              to={`/projects/${project._id}/board`}
              onClick={onClose}
              className={`p-2 mb-2 rounded-lg transition-colors ${
                isActive ? 'bg-primary-50' : 'hover:bg-gray-100'
              }`}
              title={project.name}
            >
              <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {project.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </Link>
          );
        })}
        {user?.role === 'admin' && (
          <Link
            to="/admin/users"
            onClick={onClose}
            className={`p-2 mt-2 rounded-lg transition-colors ${
              location.pathname === '/admin/users'
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="User Management"
          >
            <Users size={20} />
          </Link>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col safe-top safe-bottom">
      {/* Mobile Close Button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close menu"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </h2>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Plus size={14} className="text-gray-500" />
            </button>
          </div>
          <button
            onClick={onToggle}
            className="hidden lg:block p-1 hover:bg-gray-100 rounded transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            RECENT
          </div>
          {projects.slice(0, 5).map((project) => {
            const isActive = location.pathname === `/projects/${project._id}/board`;
            return (
              <Link
                key={project._id}
                to={`/projects/${project._id}/board`}
                onClick={onClose}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm flex-1 truncate">{project.name}</span>
              </Link>
            );
          })}
          {projects && projects.length > 5 && (
            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
              View all projects
            </button>
          )}
        </div>
        
        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Admin
            </div>
            <Link
              to="/admin/users"
              onClick={onClose}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin/users'
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={16} />
              <span className="text-sm">User Management</span>
            </Link>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-600 mb-1">You're in a team-managed project</p>
        <a href="#" className="text-xs text-primary-600 hover:underline flex items-center">
          <span className="mr-1">🔊</span>
          Give feedback
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;

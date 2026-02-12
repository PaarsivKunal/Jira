import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { getShortcuts, deleteShortcut, deleteAllShortcuts } from '../../services/api';
import { X, ExternalLink, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import AddShortcutModal from './AddShortcutModal';

const ShortcutsDropdown = ({ isOpen, onClose, onAddShortcut }) => {
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: shortcuts } = useQuery({
    queryKey: ['shortcuts'],
    queryFn: () => getShortcuts().then((res) => res.data),
    enabled: isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteShortcut(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['shortcuts']);
      toast.success('Shortcut removed');
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllShortcuts(),
    onSuccess: () => {
      queryClient.invalidateQueries(['shortcuts']);
      toast.success('All shortcuts removed');
      onClose();
    },
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleShortcutClick = (url) => {
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={dropdownRef}
        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SHORTCUTS
            </h3>
            {shortcuts && shortcuts.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove all shortcuts?')) {
                    deleteAllMutation.mutate();
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Remove shortcuts
              </button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {shortcuts && shortcuts.length > 0 ? (
            <div className="p-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut._id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                >
                  <button
                    onClick={() => handleShortcutClick(shortcut.url)}
                    className="flex items-center space-x-2 flex-1 text-left"
                  >
                    {shortcut.icon && (
                      <span className="text-lg">{shortcut.icon}</span>
                    )}
                    <span className="text-sm text-gray-900">{shortcut.name}</span>
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(shortcut._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500 mb-4">No shortcuts yet</p>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-200">
          <button
            onClick={onAddShortcut}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <Plus size={16} />
            <span>Add shortcut</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ShortcutsDropdown;


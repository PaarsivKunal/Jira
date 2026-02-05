import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createShortcut } from '../../services/api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const AddShortcutModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => createShortcut(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shortcuts']);
      toast.success('You have added the shortcut', {
        duration: 4000,
        icon: '✅',
      });
      setFormData({ name: '', url: '' });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add shortcut');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.url.trim()) {
      createMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', url: '' });
    onClose();
  };

  const isFormValid = formData.name.trim() && formData.url.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Add shortcut</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Required fields are marked with an asterisk*
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Web address*
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name*
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Atlassian website"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Pro tip: Start your shortcut's name with emoji to customize its icon.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || createMutation.isPending}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  isFormValid
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {createMutation.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddShortcutModal;


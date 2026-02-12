import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateOrganizationModal = ({ onClose, onSubmit, isLoading, userEmail }) => {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
  });

  useEffect(() => {
    // Extract domain from email and suggest organization name
    if (userEmail) {
      const emailParts = userEmail.split('@');
      if (emailParts.length > 1) {
        const domain = emailParts[1];
        const orgName = domain.split('.')[0];
        const capitalizedName = orgName.charAt(0).toUpperCase() + orgName.slice(1);
        
        setFormData({
          name: capitalizedName,
          domain: domain,
        });
      }
    }
  }, [userEmail]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      domain: formData.domain.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Create Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-primary-800 text-sm">
              <strong>Note:</strong> Creating an organization will assign your account to it. 
              You'll need to refresh the page after creation.
            </p>
          </div>

          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name *
            </label>
            <input
              id="orgName"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="My Company"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be your team's workspace name
            </p>
          </div>

          <div>
            <label htmlFor="orgDomain" className="block text-sm font-medium text-gray-700 mb-1">
              Domain (Optional)
            </label>
            <input
              id="orgDomain"
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="example.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email domain for this organization (e.g., company.com)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  Create Organization
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;


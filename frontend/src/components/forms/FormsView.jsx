import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getForms, deleteForm } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus,
  X,
  FileText,
  MoreVertical,
  Copy,
  Trash2,
  ExternalLink,
  CheckSquare,
  Users,
  Briefcase,
  Calendar,
  ThumbsUp,
  Palette,
  Mail,
} from 'lucide-react';

const formTemplates = [
  {
    id: 'marketing-campaign',
    name: 'Marketing campaign',
    icon: Briefcase,
    color: 'bg-blue-500',
    description: 'Request a campaign and management plan.',
  },
  {
    id: 'content-creation',
    name: 'Content creation',
    icon: FileText,
    color: 'bg-orange-500',
    description: 'Request a content for a blog or website.',
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    icon: Calendar,
    color: 'bg-green-500',
    description: 'Request and organize an event.',
  },
  {
    id: 'social-media-post',
    name: 'Social media post',
    icon: ThumbsUp,
    color: 'bg-blue-500',
    description: 'Request social media posts and scheduling.',
  },
  {
    id: 'graphic-design',
    name: 'Graphic design',
    icon: Palette,
    color: 'bg-purple-500',
    description: 'Request designs for a website or email.',
  },
  {
    id: 'email-marketing',
    name: 'Email marketing',
    icon: Mail,
    color: 'bg-red-500',
    description: 'Request an email campaign and scheduling.',
  },
];

const FormsView = ({ onCreateForm, onUseTemplate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTemplates, setShowTemplates] = useState(false);
  const queryClient = useQueryClient();

  const { data: formsResponse, refetch } = useQuery({
    queryKey: ['forms', id],
    queryFn: () => getForms(id).then((res) => res.data),
  });

  // Extract forms array from paginated response
  const forms = Array.isArray(formsResponse?.data) 
    ? formsResponse.data 
    : Array.isArray(formsResponse) 
    ? formsResponse 
    : [];

  const deleteMutation = useMutation({
    mutationFn: (formId) => deleteForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries(['forms', id]);
      toast.success('Form deleted');
    },
  });

  const handleCopyLink = (shareUrl) => {
    const url = `${window.location.origin}/forms/${shareUrl}`;
    navigator.clipboard.writeText(url);
    toast.success('Form link copied to clipboard');
  };

  const handleDelete = (formId) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      deleteMutation.mutate(formId);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Simplify your work intake with forms
          </h1>
          <p className="text-gray-600 mb-4">
            Share a form, collect info, and track work requests from stakeholders.{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Learn more about forms
            </a>
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onCreateForm?.()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Create form
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`px-4 py-2 rounded-lg font-medium ${
                showTemplates
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Templates
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className={`${showTemplates ? 'col-span-2' : 'col-span-3'}`}>
          {/* Illustration Section */}
          {(!forms || forms.length === 0) && !showTemplates && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="border-2 border-yellow-400 rounded-lg p-6 bg-white shadow-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">Job name</label>
                        <div className="h-8 bg-gray-100 rounded"></div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Due Date</label>
                        <div className="h-8 bg-gray-100 rounded"></div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Attachment</label>
                        <div className="h-8 bg-gray-100 rounded"></div>
                      </div>
                      <button className="w-full h-8 bg-primary-600 text-white rounded text-sm">
                        Share
                      </button>
                    </div>
                  </div>
                  <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xl">
                      →
                    </div>
                  </div>
                </div>
                <div className="ml-8">
                  <div className="bg-blue-100 rounded-lg p-6">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Issues</div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Summary</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Status</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Reporter</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Create and share</h3>
                  <p className="text-sm text-gray-600">
                    Customize forms to get the details you need.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Receive requests</h3>
                  <p className="text-sm text-gray-600">
                    View and prioritize issues right here in your project.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Forms */}
          {forms && forms.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Forms</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {forms.slice(0, 6).map((form) => {
                  const colors = ['bg-purple-500', 'bg-red-500', 'bg-blue-500', 'bg-green-500'];
                  const colorIndex = form._id.charCodeAt(form._id.length - 1) % colors.length;
                  const headerColor = colors[colorIndex];

                  return (
                    <div
                      key={form._id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/projects/${id}/forms/${form._id}`)}
                    >
                      <div className={`${headerColor} h-2`}></div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <FileText className="w-8 h-8 text-gray-400" />
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <MoreVertical size={16} className="text-gray-500" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{form.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Last edited{' '}
                          {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}{' '}
                          by {form.lastEditedBy?.name || 'you'}
                        </p>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <CheckSquare size={14} />
                            <span>Task</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <Users size={14} />
                            <span>Limited</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(form.shareUrl);
                            }}
                            className="ml-auto p-1 hover:bg-gray-100 rounded"
                            title="Copy form link"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Templates Sidebar */}
        {showTemplates && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              PREVIEW A TEMPLATE FOR YOUR NEXT REQUEST.
            </p>
            <div className="space-y-3">
              {formTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    onClick={() => onUseTemplate?.(template)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`${template.color} p-2 rounded`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm mb-1">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-600">{template.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormsView;


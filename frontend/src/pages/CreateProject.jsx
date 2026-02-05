import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, FolderKanban, LayoutGrid, List, Columns } from 'lucide-react';
import { createProject } from '../services/api';
import toast from 'react-hot-toast';

const templates = [
  {
    id: 'kanban',
    name: 'Kanban',
    icon: Columns,
    color: 'bg-orange-500',
    description: 'Manage design projects effectively, visualize tasks, and see team workload.',
    recommended: false,
  },
  {
    id: 'web-design',
    name: 'Web design process',
    icon: LayoutGrid,
    color: 'bg-green-500',
    description: 'Build web pages plus keep designers and developers on the same page.',
    recommended: true,
  },
  {
    id: 'scrum',
    name: 'Scrum',
    icon: List,
    color: 'bg-purple-500',
    description: 'Plan, prioritize, and schedule sprints using scrum framework.',
    recommended: false,
  },
];

const CreateProject = () => {
  const [formData, setFormData] = useState({
    name: 'Landing Page',
    key: 'LP',
    template: 'web-design',
    projectType: 'team-managed',
    access: 'open',
  });
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const selectedTemplate = templates.find((t) => t.id === formData.template);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createProject({
        name: formData.name,
        key: formData.key,
        description: `Project created with ${selectedTemplate?.name} template`,
      });
      toast.success('Project created successfully');
      navigate(`/projects/${response.data._id}/board`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
            Back to projects
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create project</h1>
            <p className="text-gray-600 mb-6">
              Explore what's possible when you collaborate with your team. Edit project details
              anytime in project settings.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Required fields are marked with an asterisk *
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Try a team name, project goal, milestone..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Template</label>
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:underline"
                    onClick={() => navigate('/projects/templates')}
                  >
                    More templates
                  </button>
                </div>
                <div className="space-y-3">
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <div
                        key={template.id}
                        onClick={() => setFormData({ ...formData, template: template.id })}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.template === template.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`${template.color} p-2 rounded`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900">{template.name}</h3>
                                {template.recommended && (
                                  <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                                    RECOMMENDED
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  className="text-sm text-primary-600 hover:underline flex items-center"
                >
                  {showMore ? (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 mr-1" />
                      Show more
                    </>
                  )}
                </button>

                {showMore && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project type
                      </label>
                      <select
                        value={formData.projectType}
                        onChange={(e) =>
                          setFormData({ ...formData, projectType: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="team-managed">Team-managed</option>
                        <option value="company-managed">Company-managed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.key}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            key: e.target.value.toUpperCase().slice(0, 10),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access</label>
                      <select
                        value={formData.access}
                        onChange={(e) => setFormData({ ...formData, access: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="open">Open</option>
                        <option value="limited">Limited</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg opacity-20 blur-3xl" />
            </div>
            <div className="relative bg-white rounded-lg shadow-lg p-6 mt-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Untitled project</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div
                    key={num}
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-700">KEY-{num}</span>
                    <div className="flex-1 h-1 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">Team-managed project</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;


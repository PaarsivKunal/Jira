import { useQuery } from '@tanstack/react-query';
import { getProjects, createProject, deleteProject } from '../services/api';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
  });
  const navigate = useNavigate();

  const { data: projectsResponse, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then((res) => res.data),
  });

  // Extract projects array from paginated response
  const projects = Array.isArray(projectsResponse?.data) 
    ? projectsResponse.data 
    : Array.isArray(projectsResponse) 
    ? projectsResponse 
    : [];

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(formData);
      toast.success('Project created successfully');
      setIsModalOpen(false);
      setFormData({ name: '', key: '', description: '' });
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        toast.success('Project deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => navigate('/projects/create')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project._id}
            className="card hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/projects/${project._id}/board`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{project.key}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project._id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description || 'No description'}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  Lead: {project.lead?.name || 'N/A'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {project.members?.length || 0} members
              </span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No projects yet. Create one to get started!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Key * (e.g., PROJ)
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      key: e.target.value.toUpperCase(),
                    })
                  }
                  className="input"
                  required
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;


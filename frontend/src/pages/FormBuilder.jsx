import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getForm, updateForm, createForm } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Copy,
  ArrowLeft,
  Settings,
  X,
} from 'lucide-react';

const FormBuilder = () => {
  const { id, formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!formId;

  const { data: form } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => getForm(formId).then((res) => res.data),
    enabled: isEditing,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [],
    settings: {
      allowAnonymous: false,
      notifyOnSubmit: true,
      autoCreateIssue: true,
      issueType: 'task',
      issueStatus: 'todo',
    },
  });

  useEffect(() => {
    if (form) {
      setFormData({
        name: form.name,
        description: form.description,
        fields: form.fields || [],
        settings: form.settings || formData.settings,
      });
    }
  }, [form]);

  const createMutation = useMutation({
    mutationFn: (data) => createForm(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['forms', id]);
      toast.success('Form created successfully');
      navigate(`/projects/${id}/forms/${data.data._id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateForm(formId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['form', formId]);
      queryClient.invalidateQueries(['forms', id]);
      toast.success('Form updated successfully');
    },
  });

  const handleAddField = (type) => {
    const newField = {
      type,
      label: '',
      name: `field_${Date.now()}`,
      placeholder: '',
      required: false,
      options: type === 'select' ? [] : undefined,
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField],
    });
  };

  const handleUpdateField = (index, updates) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData({ ...formData, fields: newFields });
  };

  const handleDeleteField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCopyLink = () => {
    if (form?.shareUrl) {
      const url = `${window.location.origin}/forms/${form.shareUrl}`;
      navigator.clipboard.writeText(url);
      toast.success('Form link copied to clipboard');
    }
  };

  const fieldTypes = [
    { type: 'text', label: 'Text' },
    { type: 'textarea', label: 'Textarea' },
    { type: 'number', label: 'Number' },
    { type: 'date', label: 'Date' },
    { type: 'select', label: 'Select' },
    { type: 'checkbox', label: 'Checkbox' },
    { type: 'file', label: 'File' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/projects/${id}/board`)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Form' : 'Create Form'}
              </h1>
              <p className="text-sm text-gray-600">
                {isEditing ? form?.name : 'Build a custom form for your project'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing && form?.shareUrl && (
              <>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Copy size={16} />
                  <span>Copy link</span>
                </button>
                <a
                  href={`/forms/${form.shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </a>
              </>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Form Builder */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter form name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Enter form description"
                />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Form Fields</h2>
              <div className="flex flex-wrap gap-2">
                {fieldTypes.map((ft) => (
                  <button
                    key={ft.type}
                    onClick={() => handleAddField(ft.type)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    + {ft.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {formData.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Label *
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            handleUpdateField(index, { label: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Field label"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            handleUpdateField(index, { name: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="field_name"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {field.type === 'textarea' && (
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) =>
                          handleUpdateField(index, { placeholder: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  )}

                  {field.type === 'select' && (
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Options (one per line)
                      </label>
                      <textarea
                        value={(field.options || []).join('\n')}
                        onChange={(e) =>
                          handleUpdateField(index, {
                            options: e.target.value.split('\n').filter((o) => o.trim()),
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                        rows={3}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                    </div>
                  )}

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) =>
                          handleUpdateField(index, { required: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Required</span>
                    </label>
                  </div>
                </div>
              ))}

              {formData.fields.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No fields added yet. Click the buttons above to add fields.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings size={20} className="mr-2" />
            Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowAnonymous}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowAnonymous: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Allow anonymous submissions</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.notifyOnSubmit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, notifyOnSubmit: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Notify on submit</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.autoCreateIssue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, autoCreateIssue: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Auto-create issue</span>
              </label>
            </div>

            {formData.settings.autoCreateIssue && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={formData.settings.issueType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, issueType: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                    <option value="story">Story</option>
                    <option value="epic">Epic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Status
                  </label>
                  <select
                    value={formData.settings.issueStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, issueStatus: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;


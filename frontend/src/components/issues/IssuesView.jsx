import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  getIssues,
  updateIssue,
  updateIssueStatus,
  getIssue,
  getIssueAttachments,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment,
  getComments,
  createComment,
  getUsers,
} from '../../services/api';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Search,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Eye,
  ThumbsUp,
  MoreVertical,
  Paperclip,
  Plus,
  Link as LinkIcon,
  Download,
  Trash2,
  Sparkles,
  Filter,
  Save,
  X,
  Bug,
  FileText,
  BookOpen,
  Zap,
  Flag,
  Calendar,
  User,
  Tag,
  Clock,
} from 'lucide-react';

const typeIcons = {
  bug: Bug,
  task: FileText,
  story: BookOpen,
  epic: Zap,
};

const priorityIcons = {
  critical: { icon: Flag, color: 'text-red-600' },
  high: { icon: ChevronUp, color: 'text-orange-600' },
  medium: { icon: MoreVertical, color: 'text-yellow-600' },
  low: { icon: ChevronDown, color: 'text-blue-600' },
};

const statusColors = {
  todo: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
};

const IssuesView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [activeFilter, setActiveFilter] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    assignee: '',
  });
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data: issuesResponse, refetch } = useQuery({
    queryKey: ['issues', id, filters, activeFilter],
    queryFn: () => {
      const params = { projectId: id };
      
      // Apply filters from dropdowns
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.assignee) params.assignee = filters.assignee;
      
      // Apply active filter from sidebar
      if (activeFilter === 'my_open') {
        params.assignee = user?._id;
        params.status = { $ne: 'done' };
      } else if (activeFilter === 'reported_by_me') {
        params.reporter = user?._id;
      } else if (activeFilter === 'open') {
        params.status = { $ne: 'done' };
      } else if (activeFilter === 'done') {
        params.status = 'done';
      }
      // 'all' filter shows everything, no additional params needed
      
      return getIssues(params).then((res) => res.data);
    },
  });

  const { data: selectedIssue } = useQuery({
    queryKey: ['issue', selectedIssueId],
    queryFn: () => getIssue(selectedIssueId).then((res) => res.data),
    enabled: !!selectedIssueId && viewMode === 'detail',
  });

  const { data: issueAttachmentsResponse } = useQuery({
    queryKey: ['issueAttachments', selectedIssueId],
    queryFn: () => getIssueAttachments(selectedIssueId).then((res) => res.data),
    enabled: !!selectedIssueId,
  });

  const { data: commentsResponse, refetch: refetchComments } = useQuery({
    queryKey: ['comments', selectedIssueId],
    queryFn: () => getComments(selectedIssueId).then((res) => res.data),
    enabled: !!selectedIssueId,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then((res) => res.data),
  });

  // Extract arrays from paginated responses
  const issues = Array.isArray(issuesResponse?.data) 
    ? issuesResponse.data 
    : Array.isArray(issuesResponse) 
    ? issuesResponse 
    : [];

  const issueAttachments = Array.isArray(issueAttachmentsResponse?.data) 
    ? issueAttachmentsResponse.data 
    : Array.isArray(issueAttachmentsResponse) 
    ? issueAttachmentsResponse 
    : [];

  const comments = Array.isArray(commentsResponse?.data) 
    ? commentsResponse.data 
    : Array.isArray(commentsResponse) 
    ? commentsResponse 
    : [];

  const users = Array.isArray(usersResponse?.data) 
    ? usersResponse.data 
    : Array.isArray(usersResponse) 
    ? usersResponse 
    : [];

  // Calculate filtered issues before using in useEffect
  const filteredIssues = issues.filter((issue) => {
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        issue.title?.toLowerCase().includes(query) ||
        issue.key?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Apply additional filters (type, status, assignee) if not already applied in query
    if (filters.type && issue.type !== filters.type) return false;
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.assignee && issue.assignee?._id !== filters.assignee && issue.assignee !== filters.assignee) return false;
    
    return true;
  });

  const selectedIndex = filteredIssues.findIndex((i) => i._id === selectedIssueId);
  const totalIssues = filteredIssues.length;

  // Auto-select first issue when issues load
  useEffect(() => {
    if (filteredIssues && filteredIssues.length > 0 && !selectedIssueId && viewMode === 'detail') {
      setSelectedIssueId(filteredIssues[0]._id);
    }
  }, [filteredIssues, selectedIssueId, viewMode]);
  
  // Reset selected issue if it's not in filtered list
  useEffect(() => {
    if (viewMode === 'detail') {
      if (selectedIssueId && filteredIssues.length > 0) {
        const index = filteredIssues.findIndex((i) => i._id === selectedIssueId);
        if (index === -1) {
          setSelectedIssueId(filteredIssues[0]._id);
        }
      } else if (filteredIssues.length === 0) {
        setSelectedIssueId(null);
      }
    }
  }, [filteredIssues, viewMode, selectedIssueId]);

  const statusMutation = useMutation({
    mutationFn: ({ issueId, status }) => updateIssueStatus(issueId, status),
    onSuccess: () => {
      refetch();
      if (selectedIssueId) {
        queryClient.invalidateQueries(['issue', selectedIssueId]);
      }
      toast.success('Status updated');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content) => createComment(selectedIssueId, content),
    onSuccess: () => {
      setCommentText('');
      refetchComments();
      toast.success('Comment added');
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file) => uploadAttachment(selectedIssueId, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['issueAttachments', selectedIssueId]);
      toast.success('Attachment uploaded');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId) => deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['issueAttachments', selectedIssueId]);
      toast.success('Attachment deleted');
    },
  });

  const handleNextIssue = () => {
    if (selectedIndex < totalIssues - 1) {
      setSelectedIssueId(filteredIssues[selectedIndex + 1]._id);
    }
  };

  const handlePrevIssue = () => {
    if (selectedIndex > 0) {
      setSelectedIssueId(filteredIssues[selectedIndex - 1]._id);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      commentMutation.mutate(commentText);
    }
  };

  const issueFilters = [
    { id: 'all', label: 'All issues' },
    { id: 'my_open', label: 'My open issues' },
    { id: 'reported_by_me', label: 'Reported by me' },
    { id: 'open', label: 'Open issues' },
    { id: 'done', label: 'Done issues' },
    { id: 'viewed_recently', label: 'Viewed recently' },
    { id: 'resolved_recently', label: 'Resolved recently' },
    { id: 'updated_recently', label: 'Updated recently' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Issue Filters */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Issues
          </h2>
          <div className="space-y-1">
            {issueFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Projects / Landing page</div>
              <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Share
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Export
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Go to all issues
              </button>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              LIST VIEW
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                viewMode === 'detail'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              DETAIL VIEW
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Sparkles size={16} className="text-gray-600" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Type</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
              <option value="story">Story</option>
              <option value="epic">Epic</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Assignee</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              More +
            </button>
            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg">
              <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                BASIC
              </button>
              <button className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-l border-gray-300">
                JQL
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Issues List */}
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option>Created</option>
                </select>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Clock size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {totalIssues > 0
                  ? `${Math.min(selectedIndex + 1, totalIssues)} of ${totalIssues} issues`
                  : '0 issues'}
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredIssues.map((issue) => {
                const TypeIcon = typeIcons[issue.type] || FileText;
                return (
                  <div
                    key={issue._id}
                    onClick={() => {
                      setSelectedIssueId(issue._id);
                      if (viewMode === 'list') {
                        navigate(`/issues/${issue._id}`);
                      }
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedIssueId === issue._id && viewMode === 'detail'
                        ? 'bg-blue-50 border-l-4 border-primary-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <TypeIcon size={14} className="text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{issue.key}</span>
                          {(() => {
                            const assigneesList = (issue.assignees && issue.assignees.length > 0)
                              ? issue.assignees
                              : (issue.assignee ? [issue.assignee] : []);
                            return assigneesList.length > 0 && (
                              <div className="flex items-center -space-x-1">
                                {assigneesList.slice(0, 2).map((assignee, index) => (
                                  <div key={assignee?._id || assignee || index} className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs border border-white" title={assignee?.name}>
                                    {assignee?.name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                ))}
                                {assigneesList.length > 2 && (
                                  <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs border border-white" title={`+${assigneesList.length - 2} more`}>
                                    +{assigneesList.length - 2}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-sm text-gray-900 mb-2 line-clamp-2">
                          {issue.title}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span
                            className={`px-2 py-0.5 rounded capitalize ${
                              statusColors[issue.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {issue.status?.replace('_', ' ')}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredIssues.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p>No issues found</p>
                </div>
              )}
            </div>
          </div>

          {/* Issue Detail Panel */}
          {viewMode === 'detail' && selectedIssue && (
            <div className="flex-1 overflow-y-auto bg-white">
              {/* Issue Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">{selectedIssue.title}</h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">{selectedIssue.key}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <button onClick={handlePrevIssue} disabled={selectedIndex === 0}>
                        <ChevronUp
                          size={16}
                          className={selectedIndex === 0 ? 'text-gray-300' : 'text-gray-600'}
                        />
                      </button>
                      <span>
                        {selectedIndex + 1} of {totalIssues}
                      </span>
                      <button
                        onClick={handleNextIssue}
                        disabled={selectedIndex === totalIssues - 1}
                      >
                        <ChevronDown
                          size={16}
                          className={
                            selectedIndex === totalIssues - 1 ? 'text-gray-300' : 'text-gray-600'
                          }
                        />
                      </button>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Eye size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <ThumbsUp size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedIssue.status}
                    onChange={(e) =>
                      statusMutation.mutate({ issueId: selectedIssue._id, status: e.target.value })
                    }
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                  <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                    Actions
                  </button>
                  <label className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-1 cursor-pointer">
                    <Paperclip size={14} />
                    <span>Attach</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadAttachmentMutation.mutate(file);
                        }
                      }}
                    />
                  </label>
                  <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-1">
                    <Plus size={14} />
                    <span>Add a child issue</span>
                  </button>
                  <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-1">
                    <LinkIcon size={14} />
                    <span>Link issue</span>
                  </button>
                </div>
              </div>

              <div className="flex">
                {/* Main Content */}
                <div className="flex-1 p-6">
                  {/* Pinned Fields */}
                  <div className="mb-6">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Your pinned fields
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Flag size={16} className="text-orange-600" />
                        <span className="text-sm text-gray-900">Priority: Medium</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Description</h2>
                    <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                      {selectedIssue.description ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedIssue.description}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Add a description...</p>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  {issueAttachments && issueAttachments.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-900">
                          Attachments {issueAttachments.length}
                        </h2>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical size={14} />
                          </button>
                          <label className="p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <Plus size={14} />
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  uploadAttachmentMutation.mutate(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {issueAttachments.map((attachment) => {
                          const isImage = attachment.mimeType.startsWith('image/');
                          return (
                            <div
                              key={attachment._id}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              {isImage ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/attachments/${attachment._id}/download`}
                                  alt={attachment.originalName}
                                  className="w-full h-32 object-cover"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                  <Paperclip size={24} className="text-gray-400" />
                                </div>
                              )}
                              <div className="p-2">
                                <div className="text-xs text-gray-900 truncate mb-1">
                                  {attachment.originalName}
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <CheckSquare size={12} />
                                  <span className="hover:text-primary-600 cursor-pointer">
                                    {selectedIssue.key}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Activity/Comments */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-gray-900">Activity</h2>
                      <select className="text-xs border border-gray-300 rounded px-2 py-1">
                        <option>Show: Comments</option>
                      </select>
                    </div>
                    <form onSubmit={handleAddComment} className="mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                            placeholder="Add a comment..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Pro tip: press M to comment
                          </p>
                        </div>
                      </div>
                    </form>

                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment._id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                            {comment.userId?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {comment.userId?.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Reporter
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                          {selectedIssue.reporter?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-gray-900">
                          {selectedIssue.reporter?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <button className="w-full text-left text-xs text-gray-600 hover:text-gray-900 py-2">
                      Show 10 empty fields
                    </button>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Created{' '}
                        {formatDistanceToNow(new Date(selectedIssue.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        Updated{' '}
                        {formatDistanceToNow(new Date(selectedIssue.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <a href="#" className="text-xs text-primary-600 hover:underline">
                        Configure
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssuesView;


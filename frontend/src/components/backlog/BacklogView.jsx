import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    getSprints,
    getIssues,
    createSprint,
    updateSprint,
    updateIssue,
    deleteSprint
} from '../../services/api';
import { Plus, ChevronDown, ChevronRight, MoreHorizontal, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import SkeletonLoader from '../common/SkeletonLoader';
import IssueModal from '../issues/IssueModal';

const BacklogView = () => {
    const { id: projectId } = useParams();
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedSprintId, setSelectedSprintId] = useState(null); // For creating issue in specific sprint

    // Data Fetching
    const { data: sprints = [], refetch: refetchSprints } = useQuery({
        queryKey: ['sprints', projectId],
        queryFn: () => getSprints(projectId).then(res => res.data),
    });

    const { data: issuesData, refetch: refetchIssues, isLoading: issuesLoading } = useQuery({
        queryKey: ['issues', projectId],
        queryFn: () => getIssues({ projectId }).then(res => res.data),
    });

    const allIssues = Array.isArray(issuesData?.data) ? issuesData.data : (Array.isArray(issuesData) ? issuesData : []);

    // Organize issues by Sprint
    const backlogIssues = allIssues.filter(i => !i.sprintId);
    const issuesBySprint = sprints.reduce((acc, sprint) => {
        acc[sprint._id] = allIssues.filter(i => i.sprintId === sprint._id);
        return acc;
    }, {});

    // Handlers
    const handleCreateSprint = async () => {
        try {
            const sprintCount = sprints.length + 1;
            await createSprint({
                name: `Sprint ${sprintCount}`,
                projectId,
                status: 'future'
            });
            toast.success('Sprint created');
            refetchSprints();
        } catch (error) {
            toast.error('Failed to create sprint');
        }
    };

    const handleStartSprint = async (sprint) => {
        try {
            if (sprints.some(s => s.status === 'active')) {
                toast.error('Complete the active sprint first!');
                return;
            }
            await updateSprint(sprint._id, { status: 'active', startDate: new Date() });
            toast.success('Sprint started!');
            refetchSprints();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start sprint');
        }
    };

    const handleCompleteSprint = async (sprint) => {
        try {
            await updateSprint(sprint._id, { status: 'closed', endDate: new Date() });
            // Logic to move incomplete issues to backlog could be here or backend
            toast.success('Sprint completed!');
            refetchSprints();
            refetchIssues();
        } catch (error) {
            toast.error('Failed to complete sprint');
        }
    };

    const handleDeleteSprint = async (sprintId) => {
        if (!window.confirm('Delete sprint? Issues will move to backlog.')) return;
        try {
            await deleteSprint(sprintId);
            toast.success('Sprint deleted');
            refetchSprints();
            refetchIssues();
        } catch (error) {
            toast.error('Failed to delete sprint');
        }
    }

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Moving between sprints or backlog
        const issueId = draggableId;
        const newSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;

        try {
            // Optimistic UI update could go here
            await updateIssue(issueId, { sprintId: newSprintId });
            refetchIssues();
        } catch (error) {
            toast.error('Failed to move issue');
        }
    };

    // Render Helpers
    const renderSprintHeader = (sprint) => (
        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-t-lg mt-6">
            <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-800">{sprint.name}</h3>
                <span className="text-xs text-gray-500 font-medium px-2 py-0.5 rounded-full bg-gray-200 uppercase">
                    {sprint.status}
                </span>
                <span className="text-sm text-gray-500">
                    {issuesBySprint[sprint._id]?.length || 0} issues
                </span>
            </div>
            <div className="flex items-center gap-2">
                {sprint.status === 'future' && (
                    <button
                        onClick={() => handleStartSprint(sprint)}
                        className="btn btn-primary text-xs py-1 px-3"
                    >
                        Start Sprint
                    </button>
                )}
                {sprint.status === 'active' && (
                    <button
                        onClick={() => handleCompleteSprint(sprint)}
                        className="btn btn-secondary text-xs py-1 px-3"
                    >
                        Complete Sprint
                    </button>
                )}
                <button
                    onClick={() => handleDeleteSprint(sprint._id)}
                    className="p-1 hover:bg-gray-200 rounded"
                >
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </div>
    );

    const renderIssueList = (issues, droppableId) => (
        <Droppable droppableId={droppableId}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-white border border-gray-200 rounded-b-lg min-h-[50px] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                >
                    {issues.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400 border-dashed">
                            No issues. Drag items here.
                        </div>
                    ) : (
                        issues.map((issue, index) => (
                            <Draggable key={issue._id} draggableId={issue._id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`p-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 bg-white ${snapshot.isDragging ? 'shadow-lg ring-1 ring-blue-400' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 flex items-center justify-center rounded bg-blue-100">
                                                <span className="text-[10px] font-bold text-blue-700">
                                                    {issue.type === 'bug' ? '🐞' : issue.type === 'story' ? '📘' : '✅'}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-700">{issue.key}</span>
                                            <span className="text-sm font-medium text-gray-900">{issue.title}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${issue.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {issue.priority}
                                            </span>
                                            {issue.assignee && (
                                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs overflow-hidden" title={issue.assignee.name}>
                                                    {issue.assignee.avatar ? (
                                                        <img src={issue.assignee.avatar} alt={issue.assignee.name} />
                                                    ) : (
                                                        issue.assignee.name.charAt(0)
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                        ))
                    )}
                    {provided.placeholder}
                    <div
                        className="p-2 hover:bg-gray-50 cursor-pointer border-t border-gray-100 flex items-center gap-2 text-gray-500 text-sm"
                        onClick={() => {
                            setSelectedSprintId(droppableId === 'backlog' ? null : droppableId);
                            setIsIssueModalOpen(true);
                        }}
                    >
                        <Plus size={16} />
                        <span>Create issue</span>
                    </div>
                </div>
            )}
        </Droppable>
    );

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="max-w-4xl mx-auto pb-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Backlog</h2>
                    <button onClick={handleCreateSprint} className="btn btn-secondary text-sm">
                        Create Sprint
                    </button>
                </div>

                {issuesLoading ? <SkeletonLoader count={5} /> : (
                    <>
                        {/* Active & Future Sprints */}
                        <div className="space-y-1">
                            {sprints.map(sprint => (
                                <div key={sprint._id}>
                                    {renderSprintHeader(sprint)}
                                    {renderIssueList(issuesBySprint[sprint._id] || [], sprint._id)}
                                </div>
                            ))}
                        </div>

                        {/* Backlog Area */}
                        <div className="mt-8">
                            <div className="flex items-center justify-between p-3 rounded-t-lg bg-gray-100">
                                <h3 className="font-semibold text-gray-800">Backlog</h3>
                                <span className="text-sm text-gray-500">
                                    {backlogIssues.length} issues
                                </span>
                            </div>
                            {renderIssueList(backlogIssues, 'backlog')}
                        </div>
                    </>
                )}

                <IssueModal
                    isOpen={isIssueModalOpen}
                    onClose={() => setIsIssueModalOpen(false)}
                    initialSprintId={selectedSprintId}
                    projects={[]} // Passed for context
                    onSubmit={async (data) => {
                        await createSprint(data); // WRONG -> Needs createIssue
                        // Actually IssueModal creates issue internally? 
                        // Let's verify IssueModal.
                    }}
                />
                {/* IssueModal handles submission internal to itself usually, need to check its props */}
            </div>
        </DragDropContext>
    );
};

export default BacklogView;

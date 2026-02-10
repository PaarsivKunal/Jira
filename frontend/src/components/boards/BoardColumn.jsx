import { Droppable, Draggable } from '@hello-pangea/dnd';
import IssueCard from '../issues/IssueCard';
import { Plus } from 'lucide-react';

const BoardColumn = ({ columnId, title, issues, color, onCreateIssue, className = '' }) => {
  return (
    <div className={`flex-1 min-w-[280px] bg-gray-50 rounded-lg ${className}`}>
      <div className={`${color} px-4 py-3 rounded-t-lg`}>
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          {title} ({issues.length})
        </h3>
      </div>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[400px] p-3 space-y-2 rounded-b-lg transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''
              }`}
          >
            {issues.map((issue, index) => (
              <Draggable
                key={issue._id}
                draggableId={String(issue._id)}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                    }}
                    className={snapshot.isDragging ? 'opacity-90' : ''}
                  >
                    <IssueCard
                      issue={issue}
                      isDragging={snapshot.isDragging}
                      provided={provided}
                      snapshot={snapshot}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <button
              onClick={() => onCreateIssue?.(columnId)}
              className="w-full mt-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <Plus size={16} />
              <span>Create</span>
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default BoardColumn;

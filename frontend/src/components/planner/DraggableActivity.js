import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DraggableActivity = ({ activity, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-50 rounded p-3 cursor-move hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{activity.title}</h4>
          <p className="text-xs text-gray-600">
            {formatTime(activity.duration)} • €{activity.cost}
          </p>
        </div>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(activity.id);
            }}
            className="text-red-600 hover:text-red-800 text-sm ml-2"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default DraggableActivity; 
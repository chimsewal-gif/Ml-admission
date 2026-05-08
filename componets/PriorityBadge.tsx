import React from 'react';
import { Flame, Star, ClipboardList } from 'lucide-react';

interface PriorityBadgeProps {
  priority: string;
  probability?: number;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  probability, 
  confidence, 
  size = 'md' 
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          text: 'text-white',
          icon: <Flame className="w-3 h-3" />,
          label: 'High Priority',
          badgeColor: 'bg-red-100 text-red-700'
        };
      case 'Medium':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          text: 'text-white',
          icon: <Star className="w-3 h-3" />,
          label: 'Medium Priority',
          badgeColor: 'bg-yellow-100 text-yellow-700'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: 'text-white',
          icon: <ClipboardList className="w-3 h-3" />,
          label: 'Low Priority',
          badgeColor: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const config = getPriorityConfig();
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.bg} ${config.text} shadow-sm`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
      {probability !== undefined && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Match Score:</span> {(probability * 100).toFixed(0)}%
          {confidence && <span className="ml-2">• Confidence: {(confidence * 100).toFixed(0)}%</span>}
        </div>
      )}
    </div>
  );
};

export default PriorityBadge;
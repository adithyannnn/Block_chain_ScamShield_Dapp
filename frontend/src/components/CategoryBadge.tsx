import React from 'react';
import { THREAT_CATEGORIES } from '../lib/urlUtils';
import { ShieldAlert, AlertTriangle, Bug, KeyRound, Copy } from 'lucide-react';

interface CategoryBadgeProps {
  categoryId: number;
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ categoryId, showIcon = true }) => {
  const cat = THREAT_CATEGORIES[categoryId] || {
    id: categoryId,
    name: `Unknown (${categoryId})`,
    description: 'Unclassified threat category.',
    color: 'text-slate-400',
    badgeBg: 'bg-slate-800 border-slate-700 text-slate-300',
  };

  const renderIcon = () => {
    switch (categoryId) {
      case 1:
        return <ShieldAlert className="w-3.5 h-3.5 mr-1" />;
      case 2:
        return <Bug className="w-3.5 h-3.5 mr-1" />;
      case 3:
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 4:
        return <KeyRound className="w-3.5 h-3.5 mr-1" />;
      case 5:
        return <Copy className="w-3.5 h-3.5 mr-1" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cat.badgeBg}`}
      title={cat.description}
    >
      {showIcon && renderIcon()}
      {cat.name}
    </span>
  );
};


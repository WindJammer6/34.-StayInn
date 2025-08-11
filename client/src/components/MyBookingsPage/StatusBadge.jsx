import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { BOOKING_STATUSES } from './constants';

const StatusBadge = ({ status }) => {
  const statusConfig = BOOKING_STATUSES[status];
  
  // Icon mapping
  const iconMap = {
    CheckCircle2: CheckCircle2,
    XCircle: XCircle,
    AlertCircle: AlertCircle
  };
  
  const Icon = iconMap[statusConfig.icon];
  
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[statusConfig.color]}`}>
      <Icon className="h-3 w-3" />
      {statusConfig.label}
    </span>
  );
};

export default StatusBadge;
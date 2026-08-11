import React from 'react';
import { getStatusColor } from '../../utils/format';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;

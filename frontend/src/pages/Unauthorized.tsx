import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState
        icon="🔒"
        title="Access Denied"
        message="You do not have permission to view this page based on your current role."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/')}
      />
    </div>
  );
};

export default Unauthorized;

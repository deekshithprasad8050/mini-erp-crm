import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/challans')) return 'Challans';
    return 'Mini ERP';
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="hamburger" onClick={onMenuClick}>
          ☰
        </button>
        <h1 className="header-title">{getPageTitle()}</h1>
      </div>
      <div className="header-user">
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{user?.name}</span>
        <span className="badge badge-active">{user?.role}</span>
      </div>
    </header>
  );
};

export default Header;

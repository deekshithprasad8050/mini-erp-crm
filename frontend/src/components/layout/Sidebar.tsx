import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', icon: '🏠', label: 'Dashboard', roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { to: '/customers', icon: '👥', label: 'Customers', roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
    { to: '/products', icon: '📦', label: 'Products', roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { to: '/challans', icon: '📋', label: 'Challans', roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  ];

  return (
    <>
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 90 }} onClick={onClose} />
      )}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          📊 Mini ERP
        </div>
        <div className="sidebar-nav">
          {links.map((link) => {
            if (user && link.roles.includes(user.role)) {
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`sidebar-link ${location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to)) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-icon">{link.icon}</span>
                  {link.label}
                </Link>
              );
            }
            return null;
          })}
        </div>
        <div className="sidebar-user">
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{user?.role}</span>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(255,255,255,0.1)' }}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

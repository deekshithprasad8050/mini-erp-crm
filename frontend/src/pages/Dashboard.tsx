import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate } from '../utils/format';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.dashboard.getStats();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div className="p-24 text-center">Failed to load dashboard data</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{stats.totalCustomers}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Active Customers</div>
          <div className="stat-value">{stats.activeCustomers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Low Stock Products</div>
          <div className="stat-value">{stats.lowStockProducts}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Draft Challans</div>
          <div className="stat-value">{stats.draftChallans}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Confirmed Challans</div>
          <div className="stat-value">{stats.confirmedChallans}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="section-title">Recent Challans</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentChallans.length === 0 ? (
                  <tr><td colSpan={4} className="text-center">No recent challans</td></tr>
                ) : (
                  stats.recentChallans.map((challan) => (
                    <tr key={challan.id}>
                      <td><Link to={`/challans/${challan.id}`} style={{ fontWeight: 500, color: 'var(--primary)', textDecoration: 'none' }}>{challan.challanNumber}</Link></td>
                      <td>{challan.customer?.customerName}</td>
                      <td>{challan.totalQuantity}</td>
                      <td><StatusBadge status={challan.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h2 className="section-title">Low Stock Alerts</h2>
            {stats.lowStockProductsList.length === 0 ? (
              <div className="text-secondary" style={{ fontSize: '14px' }}>All products have sufficient stock.</div>
            ) : (
              <div className="table-container" style={{ margin: '-24px', marginTop: '0', borderRadius: '0' }}>
                <table>
                  <tbody>
                    {stats.lowStockProductsList.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{product.productName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{product.sku}</div>
                        </td>
                        <td className="text-right">
                          <span className="badge badge-low-stock">{product.currentStock} / {product.minimumStock}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="section-title">Upcoming Follow-ups</h2>
            {stats.upcomingFollowUps.length === 0 ? (
              <div className="text-secondary" style={{ fontSize: '14px' }}>No upcoming follow-ups.</div>
            ) : (
              <div className="table-container" style={{ margin: '-24px', marginTop: '0', borderRadius: '0' }}>
                <table>
                  <tbody>
                    {stats.upcomingFollowUps.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <Link to={`/customers/${customer.id}`} style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
                            {customer.customerName}
                          </Link>
                        </td>
                        <td className="text-right text-secondary" style={{ fontSize: '13px' }}>
                          {customer.followUpDate ? formatDate(customer.followUpDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

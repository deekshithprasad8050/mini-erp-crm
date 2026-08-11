import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { SalesChallan } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/format';

const ChallanList: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      
      const response = await api.challans.list(params);
      if (response.success) {
        setChallans(response.data);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching challans', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales Challans</h1>
        {canCreate && (
          <Link to="/challans/create" className="btn btn-primary">
            + Create Challan
          </Link>
        )}
      </div>

      <div className="filters-row">
        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner />
        ) : challans.length === 0 ? (
          <EmptyState title="No challans found" message="Try adjusting your filters or create a new challan." />
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Total Qty</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((c) => (
                    <tr key={c.id}>
                      <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.challanNumber}</div></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.customer?.customerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.customer?.businessName}</div>
                      </td>
                      <td>{c.totalQuantity} items</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.user?.name || c.createdBy}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td>
                        <Link to={`/challans/${c.id}`} className="btn btn-ghost btn-sm">View Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px' }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChallanList;

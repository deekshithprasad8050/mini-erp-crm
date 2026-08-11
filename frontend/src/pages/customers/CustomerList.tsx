import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Customer } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import CustomerForm from './CustomerForm';
import { formatDate } from '../../utils/format';

const CustomerList: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.customerType = typeFilter;
      
      const response = await api.customers.list(params);
      if (response.success) {
        setCustomers(response.data);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching customers', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [fetchCustomers]);

  const handleOpenModal = (customer?: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(undefined);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchCustomers();
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add Customer
          </button>
        )}
      </div>

      <div className="filters-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select className="filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" message="Try adjusting your filters or add a new customer." />
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Business</th>
                    <th>Mobile</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Follow-up</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td><div style={{ fontWeight: 500 }}>{c.customerName}</div></td>
                      <td>{c.businessName}</td>
                      <td>{c.mobileNumber}</td>
                      <td><span className={`badge badge-${c.customerType.toLowerCase()}`}>{c.customerType}</span></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.followUpDate ? formatDate(c.followUpDate) : '-'}</td>
                      <td>
                        <div className="flex gap-12">
                          <Link to={`/customers/${c.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>View</Link>
                          {canEdit && (
                            <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px', border: 'none' }} onClick={() => handleOpenModal(c)}>
                              Edit
                            </button>
                          )}
                        </div>
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCustomer ? "Edit Customer" : "Add Customer"} size="lg">
        <CustomerForm customer={editingCustomer} onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default CustomerList;

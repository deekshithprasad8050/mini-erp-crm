import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Customer, CustomerFollowUp } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import CustomerForm from './CustomerForm';
import { formatDate, formatDateTime } from '../../utils/format';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchCustomerData = async () => {
    if (!id) return;
    try {
      const [customerRes, followUpsRes] = await Promise.all([
        api.customers.getById(id),
        api.customers.getFollowUps(id)
      ]);
      if (customerRes.success && customerRes.data) {
        setCustomer(customerRes.data);
      }
      if (followUpsRes.success && followUpsRes.data) {
        setFollowUps(followUpsRes.data);
      }
    } catch (error) {
      showToast('Failed to load customer details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !followUpNote.trim()) return;
    
    setIsSubmittingFollowUp(true);
    try {
      const payload: any = { note: followUpNote };
      if (followUpDate) payload.followUpDate = new Date(followUpDate).toISOString();
      
      const res = await api.customers.createFollowUp(id, payload);
      if (res.success && res.data) {
        setFollowUps([res.data, ...followUps]);
        setFollowUpNote('');
        setFollowUpDate('');
        showToast('Follow-up added successfully', 'success');
        
        // Refresh customer to get updated followUpDate
        fetchCustomerData();
      }
    } catch (error) {
      showToast('Failed to add follow-up', 'error');
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/customers')}>
        ← Back to Customers
      </button>

      <div className="dashboard-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="detail-header">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{customer.customerName}</h2>
              <div className="flex gap-8">
                <StatusBadge status={customer.status} />
                <span className={`badge badge-${customer.customerType.toLowerCase()}`}>{customer.customerType}</span>
              </div>
            </div>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsEditModalOpen(true)}>Edit</button>
            )}
          </div>

          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Business Name</div>
              <div className="info-value">{customer.businessName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Mobile</div>
              <div className="info-value">{customer.mobileNumber}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">{customer.email || '-'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">GST Number</div>
              <div className="info-value">{customer.gstNumber || '-'}</div>
            </div>
          </div>
          
          <div className="mt-24">
            <div className="info-label">Address</div>
            <div className="info-value" style={{ marginTop: '8px', whiteSpace: 'pre-line' }}>{customer.address}</div>
          </div>
          
          {customer.notes && (
            <div className="mt-24">
              <div className="info-label">Notes</div>
              <div className="info-value" style={{ marginTop: '8px', whiteSpace: 'pre-line' }}>{customer.notes}</div>
            </div>
          )}
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 className="section-title">Follow-ups</h3>
          
          <form onSubmit={handleFollowUpSubmit} className="mb-24 p-16" style={{ background: '#f8f9fa', borderRadius: '8px' }}>
            <div className="form-group">
              <textarea 
                className="form-textarea" 
                placeholder="Add a new note..." 
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                required
                style={{ minHeight: '60px' }}
              />
            </div>
            <div className="flex-between">
              <div>
                <label className="form-label" style={{ display: 'inline-block', marginRight: '8px' }}>Next Follow-up:</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', padding: '6px' }}
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingFollowUp}>
                Add Note
              </button>
            </div>
          </form>

          <div className="followup-list">
            {followUps.length === 0 ? (
              <div className="text-center text-secondary p-16">No follow-ups recorded yet.</div>
            ) : (
              followUps.map(fu => (
                <div key={fu.id} className="followup-item">
                  <div className="followup-note">{fu.note}</div>
                  <div className="followup-meta">
                    <span>By: {fu.user?.name || fu.createdBy}</span>
                    <span>• {formatDateTime(fu.createdAt)}</span>
                    {fu.followUpDate && (
                      <span className="text-primary" style={{ fontWeight: 500 }}>
                        • Next: {formatDate(fu.followUpDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer" size="lg">
        <CustomerForm 
          customer={customer} 
          onSuccess={() => { setIsEditModalOpen(false); fetchCustomerData(); }} 
        />
      </Modal>
    </div>
  );
};

export default CustomerDetail;

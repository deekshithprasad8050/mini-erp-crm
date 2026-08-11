import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { SalesChallan } from '../../types';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';

const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState<'CONFIRM' | 'CANCEL' | null>(null);

  const fetchChallanData = async () => {
    if (!id) return;
    try {
      const res = await api.challans.getById(id);
      if (res.success && res.data) {
        setChallan(res.data);
      }
    } catch (error) {
      showToast('Failed to load challan details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallanData();
  }, [id]);

  const handleAction = async () => {
    if (!id || !actionModal) return;
    setIsSubmitting(true);
    try {
      if (actionModal === 'CONFIRM') {
        await api.challans.confirm(id);
        showToast('Challan confirmed successfully', 'success');
      } else {
        await api.challans.cancel(id);
        showToast('Challan cancelled successfully', 'success');
      }
      setActionModal(null);
      fetchChallanData();
    } catch (error: any) {
      showToast(error.response?.data?.message || `Failed to ${actionModal.toLowerCase()} challan`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!challan) return <div>Challan not found</div>;

  const totalAmount = challan.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/challans')}>
        ← Back to Challans
      </button>

      <div className="card mb-24">
        <div className="detail-header">
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Challan {challan.challanNumber}</h2>
            <StatusBadge status={challan.status} />
          </div>
          <div className="flex gap-12">
            {challan.status === 'DRAFT' && (
              <>
                <button className="btn btn-danger" onClick={() => setActionModal('CANCEL')}>Cancel</button>
                <button className="btn btn-success" onClick={() => setActionModal('CONFIRM')}>Confirm Order</button>
              </>
            )}
            <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print</button>
          </div>
        </div>

        <div className="info-grid mt-24 pb-24" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="info-item">
            <div className="info-label">Customer Name</div>
            <div className="info-value">{challan.customer?.customerName}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Business Name</div>
            <div className="info-value">{challan.customer?.businessName}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Created By</div>
            <div className="info-value">{challan.user?.name || challan.createdBy}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Created Date</div>
            <div className="info-value">{formatDateTime(challan.createdAt)}</div>
          </div>
        </div>

        <h3 className="section-title mt-24 mb-16">Order Items</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="text-right">Unit Price</th>
                <th className="text-center">Quantity</th>
                <th className="text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.productNameSnapshot}</td>
                  <td style={{ fontFamily: 'monospace' }}>{item.skuSnapshot}</td>
                  <td className="text-right">{formatCurrency(item.unitPriceSnapshot)}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="challan-summary" style={{ background: '#f8f9fa', padding: '24px', borderRadius: '8px', marginTop: '24px' }}>
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div className="flex-between mb-16">
              <span className="text-secondary">Total Quantity:</span>
              <span style={{ fontWeight: 600 }}>{challan.totalQuantity} items</span>
            </div>
            <div className="flex-between" style={{ fontSize: '18px', borderTop: '2px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontWeight: 600 }}>Grand Total:</span>
              <span className="text-primary" style={{ fontWeight: 700 }}>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={!!actionModal} onClose={() => !isSubmitting && setActionModal(null)} title={`${actionModal === 'CONFIRM' ? 'Confirm' : 'Cancel'} Challan`}>
        <div className="confirm-dialog">
          <div className="confirm-icon">{actionModal === 'CONFIRM' ? '✅' : '❌'}</div>
          <h3 className="confirm-title">Are you sure?</h3>
          <p className="confirm-message">
            {actionModal === 'CONFIRM' 
              ? 'Confirming will permanently deduct items from inventory stock. This action cannot be undone.' 
              : 'Cancelling this draft will mark it as cancelled permanently.'}
          </p>
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={() => setActionModal(null)} disabled={isSubmitting}>No, Go Back</button>
            <button 
              className={`btn ${actionModal === 'CONFIRM' ? 'btn-success' : 'btn-danger'}`} 
              onClick={handleAction} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : `Yes, ${actionModal === 'CONFIRM' ? 'Confirm' : 'Cancel'} It`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChallanDetail;

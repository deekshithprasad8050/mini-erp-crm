import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Product, StockMovement } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductForm from './ProductForm';
import { formatCurrency, formatDateTime } from '../../utils/format';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [movementType, setMovementType] = useState('IN');
  const [quantityChanged, setQuantityChanged] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  const canEdit = user?.role === 'ADMIN';

  const fetchProductData = async () => {
    if (!id) return;
    try {
      const [productRes, movementsRes] = await Promise.all([
        api.products.getById(id),
        api.products.getStockMovements(id)
      ]);
      if (productRes.success && productRes.data) {
        setProduct(productRes.data);
      }
      if (movementsRes.success && movementsRes.data) {
        setMovements(movementsRes.data as any); // Using any because the type definition might vary (paginated vs array)
      }
    } catch (error) {
      showToast('Failed to load product details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !quantityChanged || !reason.trim()) return;
    
    setIsSubmittingStock(true);
    try {
      const qty = Number(quantityChanged);
      if (qty <= 0) {
        showToast('Quantity must be greater than 0', 'error');
        return;
      }

      if (movementType === 'OUT' && product && qty > product.currentStock) {
        showToast(`Cannot remove ${qty}. Current stock is only ${product.currentStock}`, 'error');
        return;
      }
      
      const payload = { 
        movementType, 
        quantityChanged: qty,
        reason 
      };
      
      const res = await api.products.addStockMovement(id, payload);
      if (res.success) {
        setQuantityChanged('');
        setReason('');
        setMovementType('IN');
        showToast('Stock updated successfully', 'success');
        
        fetchProductData();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update stock', 'error');
    } finally {
      setIsSubmittingStock(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return <div>Product not found</div>;

  const isLowStock = product.currentStock <= product.minimumStock;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/products')}>
        ← Back to Products
      </button>

      <div className="dashboard-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="detail-header">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{product.productName}</h2>
              <div className="flex gap-8">
                <span className="badge badge-inactive" style={{ fontFamily: 'monospace' }}>{product.sku}</span>
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{product.category}</span>
              </div>
            </div>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsEditModalOpen(true)}>Edit</button>
            )}
          </div>

          <div className="info-grid mt-24">
            <div className="info-item">
              <div className="info-label">Unit Price</div>
              <div className="info-value text-primary" style={{ fontSize: '18px', fontWeight: 600 }}>{formatCurrency(product.unitPrice)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Warehouse</div>
              <div className="info-value">{product.warehouseLocation}</div>
            </div>
          </div>
          
          <div className="card mt-24" style={{ background: isLowStock ? '#fff5f5' : '#f0fdf4', border: `1px solid ${isLowStock ? '#fecaca' : '#bbf7d0'}`, boxShadow: 'none' }}>
            <div className="flex-between">
              <div>
                <div className="info-label" style={{ color: isLowStock ? 'var(--danger)' : 'var(--success)' }}>Current Stock</div>
                <div className="info-value" style={{ fontSize: '32px', color: isLowStock ? 'var(--danger)' : 'var(--success)' }}>
                  {product.currentStock}
                </div>
              </div>
              <div className="text-right">
                <div className="info-label">Minimum Stock</div>
                <div className="info-value">{product.minimumStock}</div>
              </div>
            </div>
            {isLowStock && (
              <div className="mt-16 text-danger font-semibold" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span> Stock is critically low. Please reorder soon.
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 className="section-title">Stock Adjustments</h3>
          
          <form onSubmit={handleStockSubmit} className="mb-24 p-16" style={{ background: '#f8f9fa', borderRadius: '8px' }}>
            <div className="form-row mb-16">
              <div className="form-group mb-0">
                <label className="form-label">Type</label>
                <select className="form-select" value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                  <option value="IN">Stock In (+)</option>
                  <option value="OUT">Stock Out (-)</option>
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  className="form-input" 
                  value={quantityChanged}
                  onChange={(e) => setQuantityChanged(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason / Reference</label>
              <input 
                type="text"
                className="form-input" 
                placeholder="e.g. Received new shipment, Damaged item..." 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="text-right mt-16">
              <button type="submit" className={`btn ${movementType === 'IN' ? 'btn-success' : 'btn-danger'} btn-sm`} disabled={isSubmittingStock}>
                {isSubmittingStock ? 'Saving...' : `Confirm Stock ${movementType}`}
              </button>
            </div>
          </form>

          <h4 className="font-semibold text-secondary mb-16" style={{ fontSize: '14px', textTransform: 'uppercase' }}>Recent History</h4>
          <div className="table-container" style={{ margin: '-24px', marginTop: '0', borderRadius: '0' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-secondary py-4">No recent movements</td></tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontSize: '13px' }}>{formatDateTime(m.createdAt)}</td>
                      <td>
                        <span className={`badge ${m.movementType === 'IN' ? 'badge-in-stock' : 'badge-low-stock'}`}>
                          {m.movementType}
                        </span>
                      </td>
                      <td className={m.movementType === 'IN' ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>
                        {m.movementType === 'IN' ? '+' : '-'}{m.quantityChanged}
                      </td>
                      <td style={{ fontSize: '13px' }}>{m.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Product" size="lg">
        <ProductForm 
          product={product} 
          onSuccess={() => { setIsEditModalOpen(false); fetchProductData(); }} 
        />
      </Modal>
    </div>
  );
};

export default ProductDetail;

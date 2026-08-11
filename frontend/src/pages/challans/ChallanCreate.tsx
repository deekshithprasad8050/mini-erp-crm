import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Customer, Product } from '../../types';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { formatCurrency } from '../../utils/format';

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

const ChallanCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<ChallanItemInput[]>([{ productId: '', quantity: 1 }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveAction, setSaveAction] = useState<'DRAFT' | 'CONFIRM'>('DRAFT');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.customers.list({ limit: 100, status: 'ACTIVE' }),
          api.products.list({ limit: 500 })
        ]);
        if (custRes.success) setCustomers(custRes.data);
        if (prodRes.success) setProducts(prodRes.data);
      } catch (error) {
        showToast('Failed to load initial data', 'error');
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (index: number, field: keyof ChallanItemInput, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotalQty = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + ((product?.unitPrice || 0) * (Number(item.quantity) || 0));
    }, 0);
  };

  const validateForm = () => {
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return false;
    }
    
    // Check for empty products or 0 quantity
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) {
        showToast(`Please select a product for row ${i + 1}`, 'error');
        return false;
      }
      if (!items[i].quantity || items[i].quantity <= 0) {
        showToast(`Quantity must be greater than 0 in row ${i + 1}`, 'error');
        return false;
      }
      
      const product = products.find(p => p.id === items[i].productId);
      if (product && saveAction === 'CONFIRM' && items[i].quantity > product.currentStock) {
         showToast(`Insufficient stock for ${product.productName}. Available: ${product.currentStock}`, 'error');
         return false;
      }
    }
    
    // Check for duplicate products
    const productIds = items.map(i => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      showToast('Duplicate products are not allowed', 'error');
      return false;
    }

    return true;
  };

  const handleActionClick = (action: 'DRAFT' | 'CONFIRM') => {
    setSaveAction(action);
    if (validateForm()) {
      if (action === 'CONFIRM') {
        setShowConfirmModal(true);
      } else {
        submitChallan(action);
      }
    }
  };

  const submitChallan = async (action: 'DRAFT' | 'CONFIRM') => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    
    try {
      const payload = {
        customerId: selectedCustomerId,
        items: items.map(i => ({ productId: i.productId, quantity: Number(i.quantity) })),
      };

      // Always create as DRAFT first
      const createRes = await api.challans.create(payload);
      if (createRes.success && createRes.data) {
        const challanId = createRes.data.id;

        // If action is CONFIRM, immediately confirm the draft challan
        if (action === 'CONFIRM') {
          try {
            await api.challans.confirm(challanId);
            showToast('Challan confirmed successfully', 'success');
          } catch (confirmError: any) {
            // Challan was created as DRAFT but confirmation failed
            showToast(
              confirmError.response?.data?.message || 'Challan saved as draft but confirmation failed. Check stock levels.',
              'error'
            );
          }
        } else {
          showToast('Challan saved as draft successfully', 'success');
        }

        navigate(`/challans/${challanId}`);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save challan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/challans')}>
        ← Back to Challans
      </button>

      <div className="card">
        <h2 className="section-title">Create New Challan</h2>

        <div className="form-group mb-24" style={{ maxWidth: '400px' }}>
          <label className="form-label">Select Customer <span className="text-danger">*</span></label>
          <select 
            className="form-select"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">-- Select a Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.customerName} - {c.businessName}</option>
            ))}
          </select>
        </div>

        <h3 className="section-title mt-24">Items List</h3>
        
        <div className="table-container mb-16">
          <table className="challan-items-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Product</th>
                <th style={{ width: '15%' }}>Available</th>
                <th style={{ width: '15%' }}>Quantity</th>
                <th style={{ width: '15%' }}>Price</th>
                <th style={{ width: '10%' }}>Total</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const selectedProduct = products.find(p => p.id === item.productId);
                
                // Disable already selected products in other rows
                const availableProducts = products.map(p => ({
                  ...p,
                  disabled: items.some((i, idx) => idx !== index && i.productId === p.id)
                }));

                return (
                  <tr key={index}>
                    <td>
                      <select 
                        className="form-select" 
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      >
                        <option value="">-- Select Product --</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id} disabled={p.disabled}>
                            {p.productName} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {selectedProduct ? (
                        <span className={`badge ${selectedProduct.currentStock <= selectedProduct.minimumStock ? 'badge-low-stock' : 'badge-in-stock'}`}>
                          {selectedProduct.currentStock}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="1" 
                        className="item-row-input" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td>{selectedProduct ? formatCurrency(selectedProduct.unitPrice) : '-'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {selectedProduct ? formatCurrency(selectedProduct.unitPrice * (item.quantity || 0)) : '-'}
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button type="button" className="remove-btn" onClick={() => removeItemRow(index)}>
                          &times;
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button type="button" className="btn btn-ghost btn-sm mb-24" onClick={addItemRow}>
          + Add Product Row
        </button>

        <div className="challan-summary">
          <div style={{ textAlign: 'right' }}>
            <div className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Total Items: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{calculateTotalQty()}</span>
            </div>
            <div className="challan-total">
              Total Amount: <span className="text-primary">{formatCurrency(calculateTotalAmount())}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-16 mt-24" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <button 
            type="button" 
            className="btn btn-warning" 
            disabled={isSubmitting}
            onClick={() => handleActionClick('DRAFT')}
          >
            Save as Draft
          </button>
          <button 
            type="button" 
            className="btn btn-success" 
            disabled={isSubmitting}
            onClick={() => handleActionClick('CONFIRM')}
          >
            Confirm Challan
          </button>
        </div>
      </div>

      <Modal isOpen={showConfirmModal} onClose={() => !isSubmitting && setShowConfirmModal(false)} title="Confirm Challan">
        <div className="confirm-dialog">
          <div className="confirm-icon">⚠️</div>
          <h3 className="confirm-title">Confirm Challan?</h3>
          <p className="confirm-message">
            Confirming this challan will permanently deduct the items from your inventory stock. This action cannot be undone.
          </p>
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>Cancel</button>
            <button className="btn btn-success" onClick={() => submitChallan('CONFIRM')} disabled={isSubmitting}>
              {isSubmitting ? 'Confirming...' : 'Yes, Confirm It'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChallanCreate;

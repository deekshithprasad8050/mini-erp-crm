import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSuccess }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    productName: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minimumStock: 0,
    warehouseLocation: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
        minimumStock: product.minimumStock,
        warehouseLocation: product.warehouseLocation,
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (product) {
        await api.products.update(product.id, formData);
        showToast('Product updated successfully', 'success');
      } else {
        await api.products.create(formData);
        showToast('Product created successfully', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Product Name</label>
        <input className="form-input" name="productName" value={formData.productName} onChange={handleChange} required />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">SKU</label>
          <input className="form-input" name="sku" value={formData.sku} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <input className="form-input" name="category" value={formData.category} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Unit Price (₹)</label>
          <input className="form-input" type="number" min="0" step="0.01" name="unitPrice" value={formData.unitPrice || ''} onChange={handleChange} required />
        </div>
        {!product && (
          <div className="form-group">
            <label className="form-label">Initial Stock</label>
            <input className="form-input" type="number" min="0" name="currentStock" value={formData.currentStock || ''} onChange={handleChange} required />
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Minimum Stock (Alert Threshold)</label>
          <input className="form-input" type="number" min="0" name="minimumStock" value={formData.minimumStock || ''} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Warehouse Location</label>
          <input className="form-input" name="warehouseLocation" value={formData.warehouseLocation} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;

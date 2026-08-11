import React, { useState, useEffect } from 'react';
import { Customer, CustomerStatus, CustomerType } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSuccess }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({
    customerName: '',
    mobileNumber: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL',
    address: '',
    status: 'LEAD',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customerName: customer.customerName,
        mobileNumber: customer.mobileNumber,
        email: customer.email || '',
        businessName: customer.businessName,
        gstNumber: customer.gstNumber || '',
        customerType: customer.customerType,
        address: customer.address,
        status: customer.status,
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (customer) {
        await api.customers.update(customer.id, formData);
        showToast('Customer updated successfully', 'success');
      } else {
        await api.customers.create(formData);
        showToast('Customer created successfully', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Customer Name</label>
          <input className="form-input" name="customerName" value={formData.customerName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input className="form-input" name="businessName" value={formData.businessName} onChange={handleChange} required />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <input className="form-input" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email (Optional)</label>
          <input className="form-input" type="email" name="email" value={formData.email} onChange={handleChange} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Customer Type</label>
          <select className="form-select" name="customerType" value={formData.customerType} onChange={handleChange}>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">GST Number (Optional)</label>
        <input className="form-input" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea className="form-textarea" name="address" value={formData.address} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" name="notes" value={formData.notes} onChange={handleChange} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;

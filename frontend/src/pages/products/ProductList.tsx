import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ProductForm from './ProductForm';
import { formatCurrency } from '../../utils/format';

const ProductList: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (lowStockOnly) params.lowStockOnly = 'true';
      
      const response = await api.products.list(params);
      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, categoryFilter, lowStockOnly]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [fetchProducts]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchProducts();
  };

  const canEdit = user?.role === 'ADMIN';

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products Inventory</h1>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Product
          </button>
        )}
      </div>

      <div className="filters-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search products or SKU..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
        <select className="filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <label className="flex gap-8" style={{ alignItems: 'center', cursor: 'pointer', fontSize: '14px', background: 'white', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <input 
            type="checkbox" 
            checked={lowStockOnly} 
            onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} 
          />
          Low Stock Only
        </label>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" message="Try adjusting your filters or add a new product." />
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Warehouse</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLowStock = p.currentStock <= p.minimumStock;
                    return (
                      <tr key={p.id}>
                        <td><div style={{ fontWeight: 500 }}>{p.productName}</div></td>
                        <td><span style={{ fontFamily: 'monospace' }}>{p.sku}</span></td>
                        <td>{p.category}</td>
                        <td>{formatCurrency(p.unitPrice)}</td>
                        <td>
                          <span className={`badge ${isLowStock ? 'badge-low-stock' : 'badge-in-stock'}`}>
                            {p.currentStock} {isLowStock && ' (LOW)'}
                          </span>
                        </td>
                        <td>{p.warehouseLocation}</td>
                        <td>
                          <Link to={`/products/${p.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>View Details</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px' }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product" size="lg">
        <ProductForm onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default ProductList;

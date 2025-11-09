import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

export default function ProductGrid({ products }) {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return <p style={{ textAlign: 'center', padding: '40px' }}>Không có sản phẩm nào.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div
          key={product.id}
          className="product-card"
          onClick={() => navigate(`/product/${product.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <div className="product-thumb">
            <img
              src={product.image || '/default-product.png'}
              alt={product.name}
            />
          </div>
          <div className="product-body">
            <h3 className="product-title">{product.name}</h3>
            <div className="product-meta">
              <span className="product-price">
                {formatPrice(product.price)}
              </span>
              {product.category_name && (
                <span className="product-category">{product.category_name}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


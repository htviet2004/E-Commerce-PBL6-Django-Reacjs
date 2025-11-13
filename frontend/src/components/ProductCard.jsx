import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../utils/CartContext';
import '../assets/ProductCard.css';  // ⬅️ Thêm import này

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  // normalize category to a string
  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name ?? product.category?.title ?? '';

  const defaultImage = '/default-product.png';
  const imgSrc = product.image || product.image_url || '/default-product.png';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    addToCart(product, 1);
    
    setShowSuccess(true);
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(false);
    }, 1500);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-thumb">
          <div className="product-image">
            <img 
              src={imageError ? defaultImage : imgSrc} 
              alt={product.name || 'Product image'}
              loading="lazy"
              onError={handleImageError}
            />
          </div>
          <div className="product-overlay">
            <button
              className={`add-to-cart-btn ${isAdding ? 'adding' : ''} ${showSuccess ? 'success' : ''}`}
              onClick={handleAddToCart}
              disabled={isAdding}
              aria-label="Thêm vào giỏ hàng"
            >
              {showSuccess ? (
                <>
                  <span className="cart-icon">✓</span>
                  <span className="cart-text">Đã thêm</span>
                </>
              ) : isAdding ? (
                <>
                  <span className="cart-icon">...</span>
                  <span className="cart-text">Đang thêm...</span>
                </>
              ) : (
                <>
                  <span className="cart-icon">+</span>
                  <span className="cart-text">Thêm vào giỏ</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="product-body">
          <h3 className="product-name">{product.name}</h3>
          {categoryName && <div className="product-category">{categoryName}</div>}

          {(() => {
            const avg =
              product.rating_avg ??
              product.average_rating ??
              product.rating ?? null;
            const cnt =
              product.rating_count ??
              product.reviews_count ??
              product.reviews?.length ??
              null;
            const hasAny = typeof cnt === 'number' ? cnt > 0 : avg !== null;

            return (
              <div
                className="product-meta-row"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}
              >
                <div className="product-price">
                  {product.price ? `${Number(product.price).toLocaleString('vi-VN')}₫` : 'Liên hệ'}
                </div>

                {hasAny ? (
                  <div
                    className="product-avg"
                    title={`${Number(avg || 0).toFixed(1)} sao`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}
                  >
                    <span style={{ fontSize: 13, lineHeight: 1, color: 'inherit' }}>
                      {Number(avg || 0).toFixed(1)}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="#f59e0b"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      aria-hidden="true"
                      style={{ display: 'block' }}
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                ) : <span /> }
              </div>
            );
          })()}
        </div>
      </Link>
    </article>
  );
}


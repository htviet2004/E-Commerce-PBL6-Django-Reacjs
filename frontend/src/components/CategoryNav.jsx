import React from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryChip from './CategoryChip.jsx';

export default function CategoryNav({ categories = [], active, onChange = () => {}, onToggleFilters }) {
  const list = Array.isArray(categories) ? categories : [];
  const navigate = useNavigate();

  return (
    <nav className="category-nav" aria-label="Categories" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="category-chips" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {list.map((cat, idx) => {
          const isString = typeof cat === 'string';
          const id = isString ? null : (cat.id ?? null);
          const name = isString ? cat : (cat.name ?? String(cat));
          const slug = isString ? null : (cat.slug ?? null);
          const valueToSend = slug ?? name ?? id ?? String(idx);

          return (
            <CategoryChip
              key={id ?? slug ?? name ?? idx}
              label={name}
              to={slug ? `/category/${encodeURIComponent(slug)}` : undefined}
              active={name === active || slug === active}
              onClick={() => onChange(valueToSend)}
            />
          );
        })}
      </div>

      <div className="category-actions" style={{ marginLeft: 'auto' }}>
        <button
          type="button"
          className="filter-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // navigate to /category/Tất cả (encoded)
            navigate(`/category/${encodeURIComponent('Tất cả')}`);
            // still notify parent if provided
            if (typeof onToggleFilters === 'function') {
              try { onToggleFilters(); } catch (err) { /* ignore */ }
            }
          }}
          aria-label="Bộ lọc"
          title="Bộ lọc"
          style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
        >
          ⚙️ Lọc
        </button>
      </div>
    </nav>
  );
}


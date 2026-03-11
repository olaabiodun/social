import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'text', 
  width, 
  height, 
  lines = 1 
}) => {
  const baseClasses = 'skeleton skeleton--' + variant;
  const combinedClasses = `${baseClasses} ${className}`.trim();
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-text-group ${className}`} style={style}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${i === lines - 1 ? 'skeleton--last' : ''}`}
            style={{
              width: i === lines - 1 ? '70%' : '100%',
              ...style
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={combinedClasses} style={style} />;
};

// Product skeleton for the product cards
export const ProductSkeleton: React.FC = () => (
  <div className="account-row skeleton-row">
    <div className="acc-platform-icon">
      <Skeleton variant="circular" width={40} height={40} />
    </div>
    <div className="acc-info">
      <Skeleton width="60%" height={20} className="acc-desc-title" />
      <Skeleton width="100%" height={16} className="acc-desc" lines={2} />
    </div>
    <div className="acc-stock-price">
      <div style={{ textAlign: "center" }}>
        <Skeleton width={40} height={12} className="stock-label" />
        <Skeleton width={30} height={18} className="stock-num" />
      </div>
      <div style={{ textAlign: "center" }}>
        <Skeleton width={40} height={12} className="price-label" />
        <Skeleton width={50} height={18} className="price-val" />
      </div>
    </div>
    <Skeleton width={80} height={36} className="buy-btn" />
  </div>
);

// Category skeleton for category cards
export const CategorySkeleton: React.FC = () => (
  <div className="category-card skeleton-card">
    <div className="category-card-icon">
      <Skeleton variant="circular" width={48} height={48} />
    </div>
    <Skeleton width="80%" height={20} className="category-card-title" />
    <Skeleton width="40%" height={16} className="category-card-count" />
  </div>
);

// Grid of product skeletons
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="products-grid">
    {Array.from({ length: count }, (_, i) => (
      <ProductSkeleton key={i} />
    ))}
  </div>
);

// Grid of category skeletons
export const CategoryGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="categories-grid">
    {Array.from({ length: count }, (_, i) => (
      <CategorySkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;

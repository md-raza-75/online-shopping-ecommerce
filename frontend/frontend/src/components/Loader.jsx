import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({ size = 'md', message = 'Loading...' }) => {
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : '';
  
  return (
    <div className="loader d-flex flex-column justify-content-center align-items-center py-5">
      <Spinner 
        animation="border" 
        role="status" 
        variant="primary"
        size={spinnerSize}
        className="mb-3"
        style={size === 'lg' ? { width: '4rem', height: '4rem' } : {}}
      >
        <span className="visually-hidden">{message}</span>
      </Spinner>
      <p className="text-muted">{message}</p>
    </div>
  );
};

// Page loader for full page
export const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
    <Loader size="lg" message="Loading content..." />
  </div>
);

// Button loader
export const ButtonLoader = () => (
  <Spinner animation="border" size="sm" role="status" className="me-2">
    <span className="visually-hidden">Loading...</span>
  </Spinner>
);

export default Loader;
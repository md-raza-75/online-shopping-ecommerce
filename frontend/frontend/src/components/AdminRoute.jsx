import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    // Check if user is logged in and is admin
    if (userInfo && userInfo.role === 'admin') {
        return <Outlet />;
    }
    
    // If not admin, redirect to home
    return <Navigate to="/" replace />;
};

export default AdminRoute;
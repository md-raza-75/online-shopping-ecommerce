// Add this function to handle invoice download
const downloadInvoice = async (orderId, orderNumber) => {
  try {
    setDownloadingId(orderId);
    
    // Get user token
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const token = userInfo?.token;
    
    if (!token) {
      toast.error('Please login to download invoice');
      navigate('/login');
      return;
    }
    
    // Make API call
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}/invoice`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Download failed');
    }
    
    // Get blob and create download link
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `ShopEasy-Invoice-${orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    toast.success('Invoice downloaded successfully!');
    
  } catch (error) {
    console.error('Download error:', error);
    
    // Handle specific errors
    if (error.message.includes('payment is completed')) {
      toast.info('Invoice will be available after payment is completed');
    } else if (error.message.includes('Access denied')) {
      toast.error('You are not authorized to download this invoice');
    } else if (error.message.includes('Order not found')) {
      toast.error('Order not found');
    } else {
      toast.error(error.message || 'Failed to download invoice');
    }
  } finally {
    setDownloadingId(null);
  }
};
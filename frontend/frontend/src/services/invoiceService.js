import api from './api';

export const invoiceService = {
  // ✅ Correct endpoint - backend में /api/orders/:id/invoice है
  downloadInvoice: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob' // Important for file download
      });
      return response;
    } catch (error) {
      console.error('Invoice download error:', error);
      throw error;
    }
  },

  // ✅ Correct endpoint - backend में /api/orders/:id/invoice-status है
  getInvoiceInfo: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice-status`);
      return response.data;
    } catch (error) {
      console.error('Invoice info error:', error);
      throw error;
    }
  },

  // Helper to trigger download
  triggerDownload: (blobData, fileName) => {
    try {
      // Check if blobData is valid
      if (!blobData || blobData.size === 0) {
        throw new Error('Empty PDF received');
      }
      
      const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Trigger download error:', error);
      throw error;
    }
  }
};
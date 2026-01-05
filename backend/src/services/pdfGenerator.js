const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.invoicesDir = path.join(__dirname, '../invoices');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  generateInvoiceNumber(orderId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    
    return `INV-${year}${month}${day}-${orderId.toString().slice(-6)}-${random}`;
  }

  async generateInvoice(order, user) {
    return new Promise((resolve, reject) => {
      try {
        const invoiceNumber = this.generateInvoiceNumber(order._id);
        const pdfFileName = `${invoiceNumber}.pdf`;
        const pdfPath = path.join(this.invoicesDir, pdfFileName);
        
        // Create PDF document
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          bufferPages: true 
        });
        
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // ========== HEADER SECTION ==========
        // Company Logo/Name
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#2C3E50')
           .text('ShopEasy', 50, 50);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#7F8C8D')
           .text('Your Trusted Shopping Partner', 50, 80);

        // Invoice Title
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor('#E74C3C')
           .text('TAX INVOICE', 400, 50);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#34495E')
           .text(`Invoice #: ${invoiceNumber}`, 400, 80)
           .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 95)
           .text(`Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 400, 110);

        // Divider Line
        doc.moveTo(50, 130).lineTo(550, 130).stroke().fillColor('#000000');

        // ========== COMPANY & CUSTOMER INFO ==========
        // Company Information (Left)
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#2C3E50')
           .text('SHOPEASY E-COMMERCE', 50, 150);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#34495E')
           .text('123 Business Street', 50, 170)
           .text('Mumbai, Maharashtra 400001', 50, 185)
           .text('Phone: +91 98765 43210', 50, 200)
           .text('Email: support@shopeasy.com', 50, 215)
           .text('GSTIN: 27ABCDE1234F1Z5', 50, 230);

        // Customer Information (Right)
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#2C3E50')
           .text('BILL TO:', 350, 150);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#34495E')
           .text(user.name.toUpperCase(), 350, 170)
           .text(user.email, 350, 185)
           .text(`Phone: ${user.phone || 'N/A'}`, 350, 200)
           .text(order.shippingAddress.address, 350, 215)
           .text(`${order.shippingAddress.city}, ${order.shippingAddress.state || ''}`, 350, 230)
           .text(`${order.shippingAddress.country} - ${order.shippingAddress.postalCode}`, 350, 245);

        // ========== ORDER DETAILS TABLE ==========
        // Table Header
        const tableTop = 280;
        
        // Header Background
        doc.rect(50, tableTop, 500, 25)
           .fill('#3498DB');
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#FFFFFF')
           .text('PRODUCT NAME', 55, tableTop + 8)
           .text('QTY', 350, tableTop + 8)
           .text('PRICE', 400, tableTop + 8)
           .text('TOTAL', 470, tableTop + 8);

        // Table Rows
        let yPos = tableTop + 25;
        
        order.items.forEach((item, index) => {
          // Alternate row colors
          const rowColor = index % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
          
          doc.rect(50, yPos, 500, 25)
             .fill(rowColor);
          
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#2C3E50')
             .text(item.name.substring(0, 40), 55, yPos + 8)
             .text(item.quantity.toString(), 350, yPos + 8)
             .text(`₹${item.price.toFixed(2)}`, 400, yPos + 8)
             .text(`₹${(item.price * item.quantity).toFixed(2)}`, 470, yPos + 8);
          
          yPos += 25;
        });

        // ========== PAYMENT SUMMARY ==========
        yPos += 20;
        
        doc.rect(350, yPos, 200, 120)
           .stroke();
        
        const subtotal = order.totalAmount;
        const tax = subtotal * 0.18; // 18% GST
        const shipping = 0; // Free shipping for now
        const grandTotal = subtotal + tax + shipping;

        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#2C3E50')
           .text('Subtotal:', 370, yPos + 15)
           .text(`₹${subtotal.toFixed(2)}`, 470, yPos + 15)
           
           .text('Tax (18% GST):', 370, yPos + 40)
           .text(`₹${tax.toFixed(2)}`, 470, yPos + 40)
           
           .text('Shipping:', 370, yPos + 65)
           .text(`₹${shipping.toFixed(2)}`, 470, yPos + 65)
           
           .text('Discount:', 370, yPos + 90)
           .text('₹0.00', 470, yPos + 90);

        // Grand Total
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#E74C3C')
           .text('GRAND TOTAL:', 370, yPos + 115)
           .text(`₹${grandTotal.toFixed(2)}`, 470, yPos + 115);

        // ========== PAYMENT INFORMATION ==========
        yPos += 150;
        
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#2C3E50')
           .text('PAYMENT INFORMATION:', 50, yPos);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#34495E')
           .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, yPos + 20)
           .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, yPos + 35)
           .text(`Transaction ID: ${order._id.toString()}`, 50, yPos + 50)
           .text(`Order Status: ${order.orderStatus.toUpperCase()}`, 50, yPos + 65);

        // ========== ORDER SUMMARY ==========
        yPos += 90;
        
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#2C3E50')
           .text('ORDER SUMMARY:', 50, yPos);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#34495E')
           .text(`Order ID: ${order._id.toString()}`, 50, yPos + 20)
           .text(`Order Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`, 50, yPos + 35)
           .text(`Items Ordered: ${order.items.length}`, 50, yPos + 50);

        // Shipping Address
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#2C3E50')
           .text('SHIPPING ADDRESS:', 50, yPos + 80);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#34495E')
           .text(order.shippingAddress.address, 50, yPos + 100)
           .text(`${order.shippingAddress.city}, ${order.shippingAddress.state || ''}`, 50, yPos + 115)
           .text(`${order.shippingAddress.country} - ${order.shippingAddress.postalCode}`, 50, yPos + 130);

        // ========== FOOTER ==========
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          
          // Footer on each page
          doc.fontSize(9)
             .font('Helvetica-Oblique')
             .fillColor('#95A5A6')
             .text('Thank you for shopping with ShopEasy!', 50, 750)
             .text('We value your business and look forward to serving you again.', 50, 765);
          
          // Terms and Conditions
          doc.fontSize(8)
             .font('Helvetica')
             .fillColor('#7F8C8D')
             .text('Terms & Conditions:', 50, 780)
             .text('1. Goods once sold cannot be returned or exchanged unless defective.', 50, 795)
             .text('2. Original invoice must be presented for any service request.', 50, 810)
             .text('3. All disputes are subject to Mumbai jurisdiction.', 50, 825)
             .text('4. This is a computer generated invoice, no signature required.', 50, 840);
        }

        // Watermark
        doc.opacity(0.1)
           .fontSize(100)
           .font('Helvetica-Bold')
           .fillColor('#BDC3C7')
           .text('PAID', 150, 300, { rotate: 30 });
        
        doc.end();

        stream.on('finish', () => {
          resolve({
            invoiceNumber: invoiceNumber,
            pdfPath: pdfPath,
            pdfUrl: `/invoices/${pdfFileName}`
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Delete invoice file
  deleteInvoice(pdfPath) {
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      return true;
    }
    return false;
  }
}

module.exports = new PDFGenerator();
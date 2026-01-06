const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.downloadsDir = path.join(process.cwd(), 'downloads');
    this.invoicesDir = path.join(this.downloadsDir, 'invoices');
    this.ensureDirectories();
  }

  ensureDirectories() {
    try {
      if (!fs.existsSync(this.downloadsDir)) {
        fs.mkdirSync(this.downloadsDir, { recursive: true });
      }
      
      if (!fs.existsSync(this.invoicesDir)) {
        fs.mkdirSync(this.invoicesDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  generateInvoice(order, user) {
    return new Promise((resolve, reject) => {
      try {
        const invoiceNumber = `INV${new Date().getFullYear()}${String(order._id).slice(-8)}`;
        const fileName = `${invoiceNumber}.pdf`;
        const filePath = path.join(this.invoicesDir, fileName);
        
        const doc = new PDFDocument({ 
          size: 'A4',
          margin: 40,
          layout: 'portrait',
          bufferPages: true
        });
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // ============ HEADER ============
        // Top: Company and Invoice
        doc.fillColor('#4F46E5')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('ShopEasy', 40, 40);
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6B7280')
           .text('Modern E-commerce Platform', 40, 70);
        
        // Invoice Title
        doc.fillColor('#111827')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('TAX INVOICE', 400, 40, { width: 160, align: 'right' });
        
        doc.fontSize(10)
           .fillColor('#4B5563')
           .text(`Invoice #: ${invoiceNumber}`, 400, 70, { width: 160, align: 'right' })
           .text(`Date: ${this.formatDate(order.createdAt)}`, 400, 85, { width: 160, align: 'right' });
        
        // Separator
        doc.strokeColor('#D1D5DB')
           .lineWidth(1)
           .moveTo(40, 110)
           .lineTo(555, 110)
           .stroke();
        
        // ============ COMPANY & CUSTOMER INFO ============
        // Company (Left)
        doc.fillColor('#111827')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Sold By:', 40, 120);
        
        doc.fontSize(10)
           .fillColor('#374151')
           .text('ShopEasy E-commerce Pvt. Ltd.', 40, 135)
           .text('123 Digital Mall, Mumbai', 40, 150)
           .text('Maharashtra 400001', 40, 165)
           .text('GSTIN: 27AABCS1429Q1Z', 40, 180)
           .text('Phone: +91 22 1234 5678', 40, 195);
        
        // Customer (Right)
        doc.fillColor('#111827')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Bill To:', 300, 120);
        
        const customerName = user?.name || order.shippingAddress?.name || 'Customer';
        const customerEmail = user?.email || 'Not provided';
        const customerPhone = user?.phone || order.shippingAddress?.phone || 'Not provided';
        
        doc.fontSize(10)
           .fillColor('#374151')
           .text(customerName, 300, 135)
           .text(`Email: ${customerEmail}`, 300, 150)
           .text(`Phone: ${customerPhone}`, 300, 165);
        
        // ✅ FIXED: Ship To - Now shows customer name and address
        if (order.shippingAddress) {
          doc.text('Ship To:', 300, 185, { bold: true });
          
          // First line: Customer name (order wala customer)
          doc.text(customerName, 300, 200);
          
          // Second line: Address
          doc.text(order.shippingAddress.address, 300, 215, { width: 240 });
          
          // Third line: City, State, Postal
          const cityState = `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`;
          doc.text(cityState, 300, 230, { width: 240 });
          
          // Fourth line: Country and phone
          let shipInfoLine = order.shippingAddress.country || 'India';
          if (order.shippingAddress.phone) {
            shipInfoLine += ` | Phone: ${order.shippingAddress.phone}`;
          }
          doc.text(shipInfoLine, 300, 245, { width: 240 });
        } else {
          // If no shipping address, show customer info in Ship To
          doc.text('Ship To:', 300, 185, { bold: true });
          doc.text(customerName, 300, 200);
          doc.text(`Phone: ${customerPhone}`, 300, 215);
        }
        
        // ============ ORDER SUMMARY ============
        const boxY = Math.max(doc.y, 270);
        const boxHeight = 30;
        
        // Order info box
        doc.fillColor('#F9FAFB')
           .rect(40, boxY, 515, boxHeight)
           .fill()
           .strokeColor('#E5E7EB')
           .rect(40, boxY, 515, boxHeight)
           .stroke();
        
        const orderInfo = [
          { label: 'Order ID:', value: `ORD${String(order._id).slice(-8)}` },
          { label: 'Order Date:', value: this.formatDate(order.createdAt) },
          { label: 'Payment:', value: order.paymentMethod },
          { label: 'Status:', value: order.orderStatus }
        ];
        
        const colWidth = 515 / 4;
        orderInfo.forEach((info, index) => {
          const x = 45 + (index * colWidth);
          doc.fontSize(9)
             .fillColor('#4B5563')
             .font('Helvetica-Bold')
             .text(info.label, x, boxY + 8, { width: colWidth - 10 });
          
          doc.fontSize(9)
             .fillColor('#1F2937')
             .font('Helvetica')
             .text(info.value, x, boxY + 22, { width: colWidth - 10 });
        });
        
        // ============ PRODUCT TABLE ============
        const tableStartY = boxY + boxHeight + 20;
        const colWidths = [250, 60, 80, 125];
        const colX = [40, 290, 350, 430];
        
        // Table Header
        doc.fillColor('#4F46E5')
           .rect(40, tableStartY, 515, 25)
           .fill();
        
        doc.fillColor('#FFFFFF')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Description', colX[0] + 5, tableStartY + 8, { width: colWidths[0] - 10 })
           .text('Qty', colX[1], tableStartY + 8, { width: colWidths[1], align: 'center' })
           .text('Unit Price', colX[2], tableStartY + 8, { width: colWidths[2], align: 'center' })
           .text('Total', colX[3], tableStartY + 8, { width: colWidths[3] - 5, align: 'right' });
        
        // Table Rows
        let currentY = tableStartY + 25;
        let subtotal = 0;
        let maxProducts = 8;
        
        const products = order.items || [];
        const displayProducts = products.slice(0, maxProducts);
        
        displayProducts.forEach((item, index) => {
          const rowY = currentY + 8;
          
          // Alternate row colors
          if (index % 2 === 0) {
            doc.fillColor('#F9FAFB')
               .rect(40, currentY, 515, 25)
               .fill();
          }
          
          // Product name
          const productName = item.name || 'Product';
          const displayName = productName.length > 40 ? 
            productName.substring(0, 37) + '...' : productName;
          
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const itemTotal = price * quantity;
          subtotal += itemTotal;
          
          doc.fontSize(9)
             .fillColor('#1F2937')
             .font('Helvetica')
             .text(displayName, colX[0] + 5, rowY, { width: colWidths[0] - 10 })
             .text(quantity.toString(), colX[1], rowY, { width: colWidths[1], align: 'center' })
             .text(`₹${price.toFixed(2)}`, colX[2], rowY, { width: colWidths[2], align: 'center' })
             .text(`₹${itemTotal.toFixed(2)}`, colX[3], rowY, { width: colWidths[3] - 5, align: 'right' });
          
          // Row border
          doc.strokeColor('#E5E7EB')
             .lineWidth(0.5)
             .moveTo(40, currentY + 25)
             .lineTo(555, currentY + 25)
             .stroke();
          
          currentY += 25;
        });
        
        // Show "..." if more products
        if (products.length > maxProducts) {
          const remaining = products.length - maxProducts;
          doc.fontSize(9)
             .fillColor('#6B7280')
             .text(`... and ${remaining} more item(s)`, colX[0] + 5, currentY + 8);
          currentY += 25;
        }
        
        // ============ CALCULATIONS ============
        const tax = subtotal * 0.18;
        const shipping = order.shippingAmount || (subtotal > 999 ? 0 : 60);
        const discount = order.discountAmount || 0;
        const grandTotal = subtotal + tax + shipping - discount;
        
        // Calculations box
        const calcY = Math.max(currentY + 20, 450);
        const calcX = 350;
        
        doc.fillColor('#F8FAFC')
           .roundedRect(calcX - 10, calcY - 10, 205, 180, 5)
           .fill()
           .strokeColor('#E2E8F0')
           .roundedRect(calcX - 10, calcY - 10, 205, 180, 5)
           .stroke();
        
        // Calculation rows
        const calculations = [
          { label: 'Subtotal:', value: `₹${subtotal.toFixed(2)}` },
          { label: 'Tax (18% GST):', value: `₹${tax.toFixed(2)}` },
          { label: 'Shipping:', value: `₹${shipping.toFixed(2)}` }
        ];
        
        if (discount > 0) {
          calculations.push({ label: 'Discount:', value: `-₹${discount.toFixed(2)}` });
        }
        
        calculations.forEach((calc, index) => {
          const yPos = calcY + (index * 25);
          doc.fontSize(10)
             .fillColor('#4B5563')
             .text(calc.label, calcX, yPos, { width: 140 })
             .fillColor('#1F2937')
             .text(calc.value, calcX + 140, yPos, { width: 55, align: 'right' });
        });
        
        // Separator
        const separatorY = calcY + (calculations.length * 25) + 5;
        doc.strokeColor('#CBD5E1')
           .lineWidth(1)
           .moveTo(calcX, separatorY)
           .lineTo(calcX + 195, separatorY)
           .stroke();
        
        // Grand Total
        const grandTotalY = separatorY + 15;
        doc.fillColor('#F3F4F6')
           .rect(calcX - 5, grandTotalY - 5, 195, 30)
           .fill();
        
        doc.fontSize(12)
           .fillColor('#111827')
           .font('Helvetica-Bold')
           .text('Grand Total:', calcX, grandTotalY, { width: 140 })
           .fillColor('#059669')
           .text(`₹${grandTotal.toFixed(2)}`, calcX + 140, grandTotalY, { 
             width: 55, 
             align: 'right', 
             bold: true 
           });
        
        // Amount in words
        doc.fontSize(9)
           .fillColor('#6B7280')
           .text(`Amount in words: ${this.numberToWords(grandTotal)} Rupees Only`, 
                 40, grandTotalY + 40, { width: 300 });
        
        // ============ PAYMENT INFO ============
        const paymentY = grandTotalY + 70;
        doc.fillColor('#111827')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Payment Information:', 40, paymentY);
        
        doc.fontSize(10)
           .fillColor('#374151')
           .text(`Payment Method: ${order.paymentMethod}`, 40, paymentY + 20)
           .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 40, paymentY + 40)
           .text(`Order Status: ${order.orderStatus}`, 40, paymentY + 60);
        
        if (order.razorpayPaymentId) {
          doc.text(`Transaction ID: ${order.razorpayPaymentId}`, 40, paymentY + 80);
        }
        
        // Payment note for pending
        if (order.paymentStatus === 'pending' && order.paymentMethod !== 'COD') {
          doc.fillColor('#DC2626')
             .fontSize(9)
             .text('Please complete payment within 7 days to avoid order cancellation.', 
                   40, paymentY + 100, { width: 300 });
        }
        
        // ============ FOOTER ============
        const footerY = 750;
        doc.strokeColor('#E5E7EB')
           .lineWidth(0.5)
           .moveTo(40, footerY)
           .lineTo(555, footerY)
           .stroke();
        
        doc.fontSize(8)
           .fillColor('#6B7280')
           .text('This is a computer generated invoice.', 40, footerY + 10)
           .text('Goods once sold will not be taken back.', 40, footerY + 22)
           .text('Subject to Mumbai jurisdiction only.', 40, footerY + 34)
           .text('www.shopeasy.com', 400, footerY + 10, { width: 155, align: 'right' })
           .text('support@shopeasy.com', 400, footerY + 22, { width: 155, align: 'right' })
           .text('Phone: 1800-123-4567', 400, footerY + 34, { width: 155, align: 'right' });
        
        // Page number
        doc.fontSize(9)
           .fillColor('#4F46E5')
           .font('Helvetica-Bold')
           .text('Page 1 of 1', 280, footerY + 50, { width: 100, align: 'center' });
        
        doc.end();
        
        stream.on('finish', () => {
          console.log(`✅ Invoice generated: ${fileName}`);
          resolve({
            invoiceNumber,
            pdfPath: filePath,
            fileName: fileName,
            invoiceUrl: `/downloads/invoices/${fileName}`
          });
        });
        
        stream.on('error', reject);
        
      } catch (error) {
        console.error('PDF Generation Error:', error);
        reject(error);
      }
    });
  }

  // Helper functions
  formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  numberToWords(num) {
    const amount = Math.round(Number(num) || 0);
    if (amount === 0) return 'Zero';
    if (amount > 9999999) return 'Large Amount';
    
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 
                   'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertTwoDigit = (n) => {
      if (n < 10) return units[n];
      if (n >= 10 && n <= 19) return teens[n - 10];
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (unit === 0) return tens[ten];
      return tens[ten] + ' ' + units[unit];
    };
    
    let words = '';
    let n = amount;
    
    // Lakhs
    if (n >= 100000) {
      const lakhs = Math.floor(n / 100000);
      if (lakhs > 0) {
        words += convertTwoDigit(lakhs) + ' Lakh ';
        n %= 100000;
      }
    }
    
    // Thousands
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      if (thousands > 0) {
        words += convertTwoDigit(thousands) + ' Thousand ';
        n %= 1000;
      }
    }
    
    // Hundreds
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      if (hundreds > 0) {
        words += units[hundreds] + ' Hundred ';
        n %= 100;
      }
    }
    
    // Last two digits
    if (n > 0) {
      if (words !== '') words += 'and ';
      words += convertTwoDigit(n);
    }
    
    return words.trim() || 'Rupees';
  }
}

module.exports = new PDFGenerator();
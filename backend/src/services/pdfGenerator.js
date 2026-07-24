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
        const invoiceNumber = order.invoice?.invoiceNumber || 
          `INV${new Date(order.createdAt || Date.now()).getFullYear()}${String(order._id).slice(-8).toUpperCase()}`;
        const fileName = `${invoiceNumber}.pdf`;
        const filePath = path.join(this.invoicesDir, fileName);

        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 20, left: 40, right: 40 },
          layout: 'portrait',
          bufferPages: true
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const margin = 40;
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const contentWidth = pageWidth - (margin * 2); // 515.28

        // ============ HEADER SECTION ============
        // Top Indigo Branding Bar
        doc.rect(0, 0, pageWidth, 12).fill('#4F46E5');

        // Company Logo / Title
        doc.fillColor('#4F46E5')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('ShopEasy', margin, 30);

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#64748B')
           .text('Modern E-commerce Platform', margin, 58);

        // Invoice Title & Primary Meta (Right Aligned)
        doc.fillColor('#0F172A')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('TAX INVOICE', margin + 300, 30, { width: 215, align: 'right' });

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#4F46E5')
           .text(`Invoice #: ${invoiceNumber}`, margin + 300, 56, { width: 215, align: 'right' });

        doc.font('Helvetica')
           .fillColor('#475569')
           .text(`Date: ${this.formatDate(order.createdAt)}`, margin + 300, 70, { width: 215, align: 'right' });

        // Divider Line
        doc.strokeColor('#E2E8F0')
           .lineWidth(1)
           .moveTo(margin, 90)
           .lineTo(margin + contentWidth, 90)
           .stroke();

        // ============ ADDRESS & CUSTOMER INFO ============
        let currentY = 100;

        // Seller Info (Left Column)
        doc.fillColor('#0F172A')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Sold By:', margin, currentY);

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text('ShopEasy E-commerce Pvt. Ltd.', margin, currentY + 14);

        doc.font('Helvetica')
           .fillColor('#475569')
           .text('123 Digital Mall, Tech Park', margin, currentY + 27)
           .text('Mumbai, Maharashtra - 400001', margin, currentY + 40)
           .text('GSTIN: 27AABCS1429Q1Z', margin, currentY + 53)
           .text('Email: support@shopeasy.com | Phone: +91 22 1234 5678', margin, currentY + 66);

        // Customer & Shipping Info (Right Column)
        const rightColX = margin + 270;

        // Bill To
        const customerName = user?.name || order.shippingAddress?.name || 'Customer';
        const customerEmail = user?.email || 'Not provided';
        const customerPhone = user?.phone || order.shippingAddress?.phone || 'Not provided';

        doc.fillColor('#0F172A')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Bill To:', rightColX, currentY);

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text(customerName, rightColX, currentY + 14);

        doc.font('Helvetica')
           .fillColor('#475569')
           .text(`Email: ${customerEmail}`, rightColX, currentY + 27)
           .text(`Phone: ${customerPhone}`, rightColX, currentY + 40);

        // Ship To
        const shipY = currentY + 58;
        doc.fillColor('#0F172A')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Ship To:', rightColX, shipY);

        const shippingAddr = order.shippingAddress || {};
        const shipName = shippingAddr.name || customerName;
        const streetAddr = shippingAddr.address || 'Address not provided';
        const cityStateZip = [
          shippingAddr.city,
          shippingAddr.state,
          shippingAddr.postalCode || shippingAddr.pincode
        ].filter(Boolean).join(', ');
        const countryPhone = [
          shippingAddr.country || 'India',
          shippingAddr.phone ? `Phone: ${shippingAddr.phone}` : null
        ].filter(Boolean).join(' | ');

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text(shipName, rightColX, shipY + 14);

        doc.font('Helvetica')
           .fillColor('#475569')
           .text(streetAddr, rightColX, shipY + 27, { width: 200 })
           .text(cityStateZip, rightColX, shipY + 40, { width: 200 })
           .text(countryPhone, rightColX, shipY + 53, { width: 200 });

        currentY = Math.max(currentY + 80, shipY + 70);

        // ============ ORDER DETAILS SUMMARY BANNER ============
        doc.fillColor('#F8FAFC')
           .rect(margin, currentY, contentWidth, 34)
           .fill()
           .strokeColor('#CBD5E1')
           .rect(margin, currentY, contentWidth, 34)
           .stroke();

        const orderIdStr = `ORD${String(order._id).slice(-8).toUpperCase()}`;
        const orderDateStr = this.formatDate(order.createdAt);
        const payMethodStr = order.paymentMethod || 'COD';
        const orderStatusStr = (order.orderStatus || 'pending').toUpperCase();

        const bannerCols = [
          { label: 'ORDER ID', value: orderIdStr },
          { label: 'ORDER DATE', value: orderDateStr },
          { label: 'PAYMENT METHOD', value: payMethodStr },
          { label: 'ORDER STATUS', value: orderStatusStr }
        ];

        const bannerColWidth = contentWidth / 4;
        bannerCols.forEach((col, i) => {
          const colX = margin + 10 + (i * bannerColWidth);
          doc.fontSize(7)
             .font('Helvetica-Bold')
             .fillColor('#64748B')
             .text(col.label, colX, currentY + 6);

          doc.fontSize(9)
             .font('Helvetica-Bold')
             .fillColor('#0F172A')
             .text(col.value, colX, currentY + 18);
        });

        currentY += 46;

        // Helper to draw Product Table Header
        const drawTableHeader = (startY) => {
          doc.fillColor('#4F46E5')
             .rect(margin, startY, contentWidth, 24)
             .fill();

          const colX = [margin + 8, margin + 35, margin + 280, margin + 350, margin + 430];
          const colW = [25, 240, 65, 75, 80];

          doc.fillColor('#FFFFFF')
             .fontSize(8)
             .font('Helvetica-Bold')
             .text('#', colX[0], startY + 7, { width: colW[0] })
             .text('Item & Description', colX[1], startY + 7, { width: colW[1] })
             .text('Qty', colX[2], startY + 7, { width: colW[2], align: 'center' })
             .text('Unit Price', colX[3], startY + 7, { width: colW[3], align: 'right' })
             .text('Total Price', colX[4], startY + 7, { width: colW[4], align: 'right' });

          return startY + 24;
        };

        currentY = drawTableHeader(currentY);

        // ============ PRODUCT ROWS ============
        let items = order.items || [];
        let subtotal = 0;

        items.forEach((item, index) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const lineTotal = price * qty;
          subtotal += lineTotal;

          const productName = item.name || 'Product';
          
          // Calculate needed height for description line wrapping
          const descWidth = 240;
          doc.fontSize(8.5).font('Helvetica');
          const textHeight = doc.heightOfString(productName, { width: descWidth });
          const rowHeight = Math.max(22, textHeight + 10);

          // Page break check (Page bottom limit ~ 730 points)
          if (currentY + rowHeight > 730) {
            doc.addPage();
            currentY = margin + 20;
            currentY = drawTableHeader(currentY);
          }

          // Alternate Row Background
          if (index % 2 === 0) {
            doc.fillColor('#F8FAFC')
               .rect(margin, currentY, contentWidth, rowHeight)
               .fill();
          }

          const colX = [margin + 8, margin + 35, margin + 280, margin + 350, margin + 430];
          const colW = [25, 240, 65, 75, 80];

          // Index #
          doc.fillColor('#475569')
             .fontSize(8.5)
             .font('Helvetica')
             .text((index + 1).toString(), colX[0], currentY + 6, { width: colW[0] });

          // Product Name (wrapped dynamically)
          doc.fillColor('#0F172A')
             .fontSize(8.5)
             .font('Helvetica-Bold')
             .text(productName, colX[1], currentY + 6, { width: colW[1] });

          // Quantity
          doc.fillColor('#1E293B')
             .font('Helvetica')
             .text(qty.toString(), colX[2], currentY + 6, { width: colW[2], align: 'center' });

          // Unit Price
          doc.text(`₹${price.toFixed(2)}`, colX[3], currentY + 6, { width: colW[3], align: 'right' });

          // Total Price
          doc.font('Helvetica-Bold')
             .text(`₹${lineTotal.toFixed(2)}`, colX[4], currentY + 6, { width: colW[4], align: 'right' });

          // Bottom Border
          doc.strokeColor('#F1F5F9')
             .lineWidth(0.5)
             .moveTo(margin, currentY + rowHeight)
             .lineTo(margin + contentWidth, currentY + rowHeight)
             .stroke();

          currentY += rowHeight;
        });

        // ============ CALCULATIONS & TOTALS ============
        const tax = typeof order.taxAmount === 'number' && order.taxAmount > 0 
          ? order.taxAmount 
          : subtotal * 0.18;
        const shipping = typeof order.shippingAmount === 'number' ? order.shippingAmount : (subtotal > 999 ? 0 : 50);
        const discount = Number(order.discountAmount) || 0;
        const grandTotal = typeof order.totalAmount === 'number' ? order.totalAmount : (subtotal + tax + shipping - discount);

        // Check space for calculation box + payment info
        if (currentY + 220 > 740) {
          doc.addPage();
          currentY = margin + 20;
        }

        const calcBoxY = currentY + 15;
        const calcBoxX = margin + 265;
        const calcBoxWidth = 250;

        // Calculation list items
        const calcRows = [
          { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}` },
          { label: 'Tax (18% GST)', value: `₹${tax.toFixed(2)}` },
          { label: 'Shipping Charges', value: shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}` }
        ];

        if (discount > 0) {
          const couponText = order.couponCode ? `Discount (${order.couponCode})` : 'Discount';
          calcRows.push({ label: couponText, value: `-₹${discount.toFixed(2)}`, isDiscount: true });
        }

        const calcBoxHeight = (calcRows.length * 20) + 45;

        // Render calculations box
        doc.fillColor('#F8FAFC')
           .roundedRect(calcBoxX, calcBoxY, calcBoxWidth, calcBoxHeight, 6)
           .fill()
           .strokeColor('#E2E8F0')
           .roundedRect(calcBoxX, calcBoxY, calcBoxWidth, calcBoxHeight, 6)
           .stroke();

        let rowY = calcBoxY + 10;
        calcRows.forEach((r) => {
          doc.fontSize(8.5)
             .font(r.isDiscount ? 'Helvetica-Bold' : 'Helvetica')
             .fillColor(r.isDiscount ? '#059669' : '#475569')
             .text(r.label, calcBoxX + 12, rowY, { width: 130 });

          doc.font('Helvetica-Bold')
             .fillColor(r.isDiscount ? '#059669' : '#1E293B')
             .text(r.value, calcBoxX + 145, rowY, { width: 92, align: 'right' });

          rowY += 20;
        });

        // Grand Total Row
        doc.strokeColor('#CBD5E1')
           .lineWidth(1)
           .moveTo(calcBoxX + 10, rowY - 4)
           .lineTo(calcBoxX + calcBoxWidth - 10, rowY - 4)
           .stroke();

        doc.fillColor('#4F46E5')
           .roundedRect(calcBoxX + 6, rowY + 2, calcBoxWidth - 12, 26, 4)
           .fill();

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#FFFFFF')
           .text('Grand Total:', calcBoxX + 15, rowY + 10, { width: 110 })
           .text(`₹${grandTotal.toFixed(2)}`, calcBoxX + 130, rowY + 10, { width: 105, align: 'right' });

        // Left Side: Amount in Words & Payment / Tracking Details
        let leftSideY = calcBoxY;

        // Amount in Words
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#475569')
           .text('AMOUNT IN WORDS:', margin, leftSideY);

        doc.fontSize(8.5)
           .font('Helvetica')
           .fillColor('#0F172A')
           .text(`${this.numberToWords(grandTotal)} Rupees Only`, margin, leftSideY + 12, { width: 245 });

        leftSideY += 40;

        // Payment Info
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#475569')
           .text('PAYMENT INFORMATION:', margin, leftSideY);

        doc.fontSize(8.5)
           .font('Helvetica')
           .fillColor('#334155')
           .text(`Method: ${order.paymentMethod || 'COD'}`, margin, leftSideY + 12)
           .text(`Status: ${(order.paymentStatus || 'pending').toUpperCase()}`, margin, leftSideY + 24);

        if (order.razorpayPaymentId) {
          doc.text(`Txn ID: ${order.razorpayPaymentId}`, margin, leftSideY + 36);
          leftSideY += 12;
        }

        leftSideY += 42;

        // Tracking & Notes (If present)
        if (order.trackingNumber || order.courierName || order.adminNotes) {
          doc.fontSize(8)
             .font('Helvetica-Bold')
             .fillColor('#475569')
             .text('DISPATCH & NOTES:', margin, leftSideY);

          let noteLine = leftSideY + 12;
          if (order.courierName) {
            doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`Courier: ${order.courierName}`, margin, noteLine);
            noteLine += 12;
          }
          if (order.trackingNumber) {
            doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`Tracking #: ${order.trackingNumber}`, margin, noteLine);
            noteLine += 12;
          }
          if (order.adminNotes) {
            doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#475569').text(`Note: ${order.adminNotes}`, margin, noteLine, { width: 245 });
          }
        }

        // ============ FOOTER ON ALL PAGES ============
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);

          const footerY = pageHeight - 45;

          doc.strokeColor('#E2E8F0')
             .lineWidth(0.5)
             .moveTo(margin, footerY)
             .lineTo(margin + contentWidth, footerY)
             .stroke();

          doc.fontSize(7.5)
             .font('Helvetica')
             .fillColor('#94A3B8')
             .text('This is a computer generated invoice and does not require a physical signature.', margin, footerY + 6, { lineBreak: false })
             .text('Goods once sold will not be taken back | Subject to Mumbai jurisdiction only', margin, footerY + 16, { lineBreak: false });

          doc.fontSize(8)
             .font('Helvetica-Bold')
             .fillColor('#4F46E5')
             .text(`Page ${i + 1} of ${pages.count}`, margin + 400, footerY + 6, { width: 115, align: 'right', lineBreak: false });

          doc.fontSize(7.5)
             .font('Helvetica')
             .fillColor('#64748B')
             .text('www.shopeasy.com', margin + 400, footerY + 16, { width: 115, align: 'right', lineBreak: false });
        }

        doc.end();

        stream.on('finish', () => {
          console.log(`✅ Professional Invoice PDF generated: ${fileName}`);
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
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = (invoiceData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      const currency = invoiceData.currency || invoiceData.payment?.currency || 'PKR';
      const formatCurrency = (value) => `${currency} ${(Number(value || 0)).toFixed(2)}`;

      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#FF385C')
         .text('BookSmart', 50, 50);
      
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text('INVOICE', 50, 85);
      
      const rightX = 450;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#717171')
         .text('Invoice Number:', rightX, 50, { width: 100, align: 'right' });
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text(invoiceData.invoiceNumber || invoiceData.bookingId, rightX, 63, { width: 100, align: 'right' });
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#717171')
         .text('Date:', rightX, 85, { width: 100, align: 'right' });
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#222222')
         .text(new Date(invoiceData.date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), rightX, 98, { width: 100, align: 'right' });
      
      doc.y = 130;

      const leftColX = 50;
      const rightColX = 300;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text('BILL TO', leftColX, doc.y);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#222222')
         .text(invoiceData.customer.name || 'Customer', leftColX, doc.y + 12);
      
      if (invoiceData.customer.email) {
        doc.fontSize(8)
           .fillColor('#717171')
           .text(invoiceData.customer.email, leftColX, doc.y + 24, { width: 220 });
      }
      
      if (invoiceData.customer.phone) {
        doc.fontSize(8)
           .fillColor('#717171')
           .text(invoiceData.customer.phone, leftColX, doc.y + 36);
      }

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text('HOTEL', rightColX, doc.y);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#222222')
         .text(invoiceData.hotel.name || 'Hotel', rightColX, doc.y + 12);
      
      if (invoiceData.hotel.address) {
        doc.fontSize(8)
           .fillColor('#717171')
           .text(invoiceData.hotel.address, rightColX, doc.y + 24, { width: 200 });
      }

      doc.y += 55;

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text('BOOKING DETAILS', 50, doc.y);
      
      doc.y += 18;
      
      const detailY = doc.y;
      const labelWidth = 100;
      const valueX = 160;
      const labelX2 = 300;
      const valueX2 = 410;
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#717171')
         .text('Booking ID:', 50, detailY);
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#222222')
         .text(String(invoiceData.bookingId).substring(0, 20), valueX, detailY, { width: 130 });
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#717171')
         .text('Check-in:', labelX2, detailY);
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#222222')
         .text(new Date(invoiceData.checkIn).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), valueX2, detailY);
      
      doc.y += 14;
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#717171')
         .text('Check-out:', 50, doc.y);
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#222222')
         .text(new Date(invoiceData.checkOut).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), valueX, doc.y);
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#717171')
         .text('Duration:', labelX2, doc.y);
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#222222')
         .text(`${invoiceData.nights || 1} ${invoiceData.nights === 1 ? 'Night' : 'Nights'} • ${invoiceData.guests || 1} ${invoiceData.guests === 1 ? 'Guest' : 'Guests'}`, valueX2, doc.y);
      
      doc.y += 28;

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text('PAYMENT BREAKDOWN', 50, doc.y);
      
      doc.y += 18;

      const descX = 50;
      const amountX = 450;
      const amountWidth = 100;
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text('Description', descX, doc.y)
         .text('Amount', amountX, doc.y, { width: amountWidth, align: 'right' });
      
      doc.moveTo(descX, doc.y + 10)
         .lineTo(descX + 500, doc.y + 10)
         .strokeColor('#DDDDDD')
         .lineWidth(0.5)
         .stroke();
      
      doc.y += 18;

      if (invoiceData.basePrice) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#222222')
           .text(`Room (${invoiceData.nights || 1} ${invoiceData.nights === 1 ? 'night' : 'nights'})`, descX, doc.y)
           .text(formatCurrency(invoiceData.basePrice), amountX, doc.y, { width: amountWidth, align: 'right' });
        doc.y += 14;
      }
      
      if (invoiceData.cleaningFee > 0) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#222222')
           .text('Cleaning Fee', descX, doc.y)
           .text(formatCurrency(invoiceData.cleaningFee), amountX, doc.y, { width: amountWidth, align: 'right' });
        doc.y += 14;
      }
      
      if (invoiceData.serviceFee > 0) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#222222')
           .text('Service Fee', descX, doc.y)
           .text(formatCurrency(invoiceData.serviceFee), amountX, doc.y, { width: amountWidth, align: 'right' });
        doc.y += 14;
      }
      
      if (invoiceData.discount > 0) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#00A699')
           .text(`Discount${invoiceData.couponCode ? ` (${invoiceData.couponCode})` : ''}`, descX, doc.y)
           .text(`-${formatCurrency(invoiceData.discount)}`, amountX, doc.y, { width: amountWidth, align: 'right' });
        doc.y += 14;
        doc.fillColor('#222222');
      }
      
      doc.y += 6;
      doc.moveTo(descX, doc.y)
         .lineTo(descX + 500, doc.y)
         .strokeColor('#222222')
         .lineWidth(1)
         .stroke();
      
      doc.y += 10;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#222222')
         .text('Total:', descX, doc.y);
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#FF385C')
         .text(formatCurrency(invoiceData.total), amountX, doc.y, { width: amountWidth, align: 'right' });
      
      doc.y += 28;

      if (invoiceData.payment) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#222222')
           .text('PAYMENT INFORMATION', 50, doc.y);
        
        doc.y += 16;
        
        const payLabelX = 50;
        const payValueX = 150;
        const payLabelX2 = 300;
        const payValueX2 = 400;
        
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#717171')
           .text('Payment Method:', payLabelX, doc.y);
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#222222')
           .text(invoiceData.payment.method || 'N/A', payValueX, doc.y, { width: 120 });
        
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#717171')
           .text('Transaction ID:', payLabelX2, doc.y);
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#222222')
           .text(invoiceData.payment.transactionId || 'N/A', payValueX2, doc.y, { width: 150 });
        
        doc.y += 14;
        
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#717171')
           .text('Payment Date:', payLabelX, doc.y);
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#222222')
           .text(new Date(invoiceData.payment.processedAt || invoiceData.payment.date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), payValueX, doc.y);
        
        doc.y += 22;
      }
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#717171')
         .text('Thank you for choosing BookSmart!', 50, doc.y, { align: 'center' });
      
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#B0B0B0')
         .text('This is a computer-generated invoice. No signature required.', 50, doc.y + 10, { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF
};

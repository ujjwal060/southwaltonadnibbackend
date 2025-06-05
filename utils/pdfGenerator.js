const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateDamageReportPDF = (damage, filePath) => {
  const doc = new PDFDocument();
  
  // Stream the document to a file
  doc.pipe(fs.createWriteStream(filePath));

  // Add title and metadata
  doc.fontSize(18).text('Damage Report', { align: 'center' });
  doc.fontSize(12).text(`Booking ID: ${damage.bookingId}`);
  doc.text(`Transaction ID: ${damage.transactionId}`);
  doc.text(`Damage: ${damage.damage}`);
  doc.text(`Reason: ${damage.reason}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  
  // Add image previews
  damage.images.forEach(image => {
    doc.addPage().image(path.join(__dirname, '../uploads', image), { width: 500 });
  });

  // Finalize the PDF and end the stream
  doc.end();
};

module.exports = generateDamageReportPDF;

const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const path = require('path');

// Create a transporter for sending the email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

// Generate PDF
const generatePDF = () => {
  const doc = new PDFDocument();
  const outputPath = path.join(__dirname, 'pdfAgreement.pdf'); // Save the file in the current directory

  doc.pipe(fs.createWriteStream(outputPath));

  // Add the content to the PDF
  doc.fontSize(18).text('South Walton Carts LLC - Rental Agreement and Terms of Service', {
    align: 'center',
    underline: true,
  });

  doc.moveDown();

  const content = `
**Delivery and Pickup Information**
- All deliveries will be made in the afternoon, starting from 2 PM, unless otherwise arranged. The exact delivery time will correspond to your reservation.
- All pickups are scheduled for 8 AM unless specified differently. Kindly ensure the cart is ready and fully charged by this time. 
- If the cart is not at the designated drop-off location by 8 AM, an additional fee of $75 will be charged for the driver to make a return trip.

**Insurance and Liability**
- The valid and collectible liability insurance and personal injury protection insurance of any authorized rental or leasing driver shall serve as the primary coverage for the liability and personal injury protection limits required under Sections 324.021(7) and 627.736 of the Florida Statutes.
- Failure to return rented property or equipment upon the expiration of the rental period, as well as failure to pay all amounts due (including costs for damages), constitutes prima facie evidence of intent to defraud and is punishable in accordance with Section 812.155 of the Florida Statutes.

**Renter’s Attestation**
- The Renter(s) attest that he/she is at least 21 years of age and possesses a valid driver’s license and insurance as required by law.
- The operator(s)/renter(s) represent and warrant that he/she is insured under a policy of insurance which would provide coverage for injuries to the operator/renter and medical bills incurred, as well as for damage to the person and property of others should an accident occur during the operation or use of the rented vehicle.
- The operator(s)/renter(s) attest that no other person shall drive the rental vehicle during the terms of this rental agreement except for authorized drivers.

**Rental Period and Vehicle Return**
- The renter agrees to return the rental property or have it ready for return at the initial delivery address immediately upon completion of the rental period in the same condition as when it was received, with normal wear and tear accepted.
- If the vehicle is not returned within 1 hour of the agreed-upon time, or if the vehicle is abandoned, the renter will bear all expenses incurred by South Walton Carts LLC in attempting to locate and recover said vehicle.

**Unsafe or Inoperable Property**
- In the event that the rental property becomes unsafe or inoperable, the Renter agrees to immediately discontinue use of the property and promptly notify South Walton Carts LLC.

**Low Speed Vehicle Operation**
- The renter(s)/operator(s) understand that a Low Speed Vehicle (LSV) is only permitted on roads with a speed limit of 35 mph or less and must comply with all traffic laws.

**Damage and Liability for Loss**
- The renter agrees to pay for any loss or damage to the rental property, including associated parts, attachments, keys, and tires.
- Unauthorized tampering or altering of any parts or components is prohibited and may incur additional charges for repairs.

**Vehicle Charge Responsibility**
- The vehicle must be returned fully charged. A one-day rental fee of $125 will be charged if the vehicle is not returned fully charged.

**Ownership**
- The title to the rented property remains with South Walton Carts LLC at all times.

**Indemnification**
- The renter agrees to indemnify and hold South Walton Carts LLC harmless against any losses, damages, expenses, or penalties arising from any injury to persons or property during the rental period.

**Legal Costs**
- Should collection or litigation become necessary to collect damages or loss, the renter agrees to pay all fees, including attorney fees and court costs.

**Renter’s Conduct**
- The renter agrees to exercise caution while operating the rented vehicle, particularly during inclement weather or hazardous situations, and will not engage in illegal activities while operating the vehicle.
- The renter understands that seat belts must be worn at all times, and any unsafe behavior may result in the forfeiture of the deposit and assumption of penalties.

**Cancellation Policy**
- Cancellations made at least 48 hours prior to the delivery date will incur no cancellation fee, but a $100 paperwork fee will apply.
- Cancellations made less than 48 hours in advance will incur a $125 cancellation fee plus the paperwork fee.

**Payment Section**
- The credit card provided will be used to charge the rental, damage deposit ($275.53), and any damage charges incurred.
- If a renter receives a parking ticket and does not pay it, a $250 fee will be charged in addition to the ticket amount by South Walton Carts LLC.

**Parking and Driving Restrictions**
- The cart may only be driven on roads with a speed limit of 35 mph or less.
- No off-road driving is allowed. Please avoid unpaved or rough roads, and failure to do so will incur cleaning fees.

**Guidelines and Rules**
- Seatbelts must be worn at all times. No lap sitting or riding is allowed.
- Infants must be secured in a car seat, and young children must use a booster seat. These are not provided by South Walton Carts LLC.
- Absolutely no driving on sidewalks, bike paths, or major highways.
- No underage drivers are allowed to operate the cart.

**Fees and Fines**
- Return cart uncharged: $125 fee.
- Damaged or curbed wheel: $150 per wheel.
- Lost key service call: $125, or $75 for a spare key.
- Unpaid parking violations: $250 plus ticket amount.
- Labor on damaged carts: $135 per hour plus parts.

**Final Acknowledgment**
- Your Booking is confirm, click on the button below to proceed with the payment.
`;

  // Set the font size for the content
  doc.fontSize(12);

  // Split content to process sections for bold text
  const sections = content.split("\n");

  sections.forEach(line => {
    if (line.startsWith("**") && line.endsWith("**")) {
      // Make the text inside ** bold
      doc.font('Helvetica-Bold').text(line.replace(/\*\*/g, '')); // Remove the ** and apply bold
    } else {
      // Normal text, use regular font
      doc.font('Helvetica').text(line);
    }
      // Add space after each line (you can adjust the number passed to moveDown() to control the space size)
      doc.moveDown(0.5); // Half a line of space
  });

  doc.end();

  return outputPath; // Return the path of the generated PDF
};


// Send Email with PDF and Button
const sendEmailWithPDFandButton = async (to, subject, text, paymentLink) => {
  // Step 1: Generate the PDF
  const pdfPath = generatePDF(); // This will save the PDF and return the path

  // Step 2: Send the email with the generated PDF attached
  const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: `
      <p>Dear Customer,</p>
      <p>${text}</p>
      <p>We have attached the Agreement PDF for your review. Please check it out.</p>
      <p>If you're ready to proceed with the payment, click the button below:</p>
      <a href="${paymentLink}" 
         style="background-color:rgb(70, 198, 207); 
                color: white; 
                padding: 14px 20px; 
                text-align: center; 
                text-decoration: none; 
                display: inline-block; 
                font-size: 16px; 
                border-radius: 5px;">
      Proceed to Payment
      </a>
      <br><br>
      <p>Thank you for choosing our service!</p>
    `,
      attachments: [
          {
              filename: 'Agreement.pdf',
              path: pdfPath, // Attach the generated PDF
          },
      ],
  };

  try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
  } catch (error) {
      console.error('Error sending email:', error);
  }
};

// Controller function to handle PDF generation and sending the email
const handleRentalAgreement = async (req, res) => {
  const { reserveAmount, email, bookingId, reservationId } = req.body; // Ensure these values are sent in the request body

  try {
      // Construct the dynamic payment link
      const paymentLink = `http://18.209.91.97:8133/Payment-admin?reserveAmount=${reserveAmount}&email=${encodeURIComponent(email)}&bookingId=${bookingId}&reservationId=${reservationId}`;

      // Step 1: Generate PDF
      const pdfPath = generatePDF();

      // Step 2: Send email with PDF attachment and payment link
      await sendEmailWithPDFandButton(
          email,
          'Your Rental Agreement',
          'Please review the attached rental agreement.',
          paymentLink
      );

      // Step 3: Send a response to the client
      res.status(200).json({ message: 'Rental Agreement and Payment Link sent successfully to User.' });
  } catch (error) {
      console.error('Error processing rental agreement:', error);
      res.status(500).json({ message: 'Failed to send rental agreement.' });
  }
};

const processPayment = (req, res) => {
  try {
    // Fetch the query parameters
    const { reserveAmount, email, bookingId, reservationId } = req.query;

    // Log the parameters (for testing)
    console.log('reserveAmount:', reserveAmount);
    console.log('Email:', email);
    console.log('Booking ID:', bookingId);
    console.log('Reservation ID:', reservationId);

    // Perform operations using these parameters
    res.status(200).json({
      message: 'Payment information fetched successfully',
      data: {
        reserveAmount,
        email,
        bookingId,
        reservationId,
      },
    });
  } catch (error) {
    console.error('Error fetching payment information:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
};

module.exports = {
  handleRentalAgreement,processPayment
};
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./gmailOAuthService');
const UserModel = require('../models/userModel');

// Create reusable transporter (configure with your email service)
const createTransporter = () => {
   // For development, you can use Gmail or a service like Mailtrap
    // For production, use a service like SendGrid, AWS SES, or Mailgun
  
   // Gmail example (requires app password)
    return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
     auth: {
        user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
     }
    });
};

const createGmailOAuth2Transporter = async (userId) => {
  try {
     const oauth2Client = await getAuthenticatedClient(userId);
      const user = await UserModel.findById(userId);
    
     if (!user || !user.email) {
        throw new Error('User email not found');
    }

      return nodemailer.createTransport({
      service: 'gmail',
       auth: {
          type: 'OAuth2',
        user: user.email,
         clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: user.gmailTokens.refresh_token,
         accessToken: user.gmailTokens.access_token
        }
    });
   } catch (error) {
      console.error('Error creating Gmail OAuth2 transporter:', error);
    throw error;
   }
};

const sendEmail = async (to, subject, html, text = '', options = {}) => {
    try {
    console.log('📧 Attempting to send email:', { to, subject, hasAttachments: options.attachments?.length > 0 });
     const { userId, useUserGmail = false, attachments = [] } = options;
    
    if (useUserGmail && userId) {
       try {
          const user = await UserModel.findById(userId);
        if (user && user.gmailAuthorized && user.gmailTokens) {
           console.log('📧 User has Gmail authorized, attempting to send from user account');
            const transporter = await createGmailOAuth2Transporter(userId);
          
           const mailOptions = {
              from: `"${user.name}" <${user.email}>`,
            to,
             subject,
              text,
            html,
             attachments
            };

           const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent from user Gmail account:', info.messageId);
          return { success: true, messageId: info.messageId, sentFrom: 'user_gmail' };
         } else {
            console.log('⚠️  User Gmail not authorized, falling back to system email');
        }
       } catch (gmailError) {
          console.error('❌ Failed to send from user Gmail:', gmailError);
        console.warn('⚠️  Falling back to system email:', gmailError.message);
       }
      }

     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Email not sent - EMAIL_USER or EMAIL_PASSWORD not configured in environment variables');
      console.log('📧 Email details that would have been sent:', { to, subject });
       return { success: false, error: 'Email service not configured', message: 'EMAIL_USER and EMAIL_PASSWORD must be set in .env file' };
      }

     console.log('📧 Using system email account to send email');
      const transporter = createTransporter();
    
     const mailOptions = {
        from: `"BookSmart Booking" <${process.env.EMAIL_USER}>`,
      to,
       subject,
        text,
      html,
       attachments
      };

     const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent from system account:', info.messageId);
    return { success: true, messageId: info.messageId, sentFrom: 'system' };
   } catch (error) {
      console.error('❌ Error sending email:', error);
    console.error('❌ Error details:', {
       message: error.message,
        code: error.code,
      response: error.response,
       stack: error.stack
      });
    return { success: false, error: error.message };
   }
};

const emailTemplates = {
    invoiceEmail: (
    payment,
     booking,
      hotel,
    customer,
     invoiceFileName = null,
      invoiceDownloadUrl = null,
    invoiceDataUri = null
   ) => {
      const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();
     const nights = booking.nights || 1;
      const fallbackBaseUrl =
      process.env.BACKEND_BASE_URL ||
       process.env.API_BASE_URL ||
        process.env.SERVER_URL ||
      process.env.APP_URL ||
       process.env.BASE_URL ||
        'http://localhost:5000';
    const normalizedBaseUrl = fallbackBaseUrl.replace(/\/$/, '');
     const invoiceUrl =
        invoiceDownloadUrl ||
      (invoiceFileName && normalizedBaseUrl
         ? `${normalizedBaseUrl}/api/payments/invoice/${booking.id || booking._id}`
          : null);
    const downloadLink = invoiceDataUri || invoiceUrl;
     const downloadCtaLabel = invoiceDataUri ? 'Open Attached Invoice' : 'Download PDF Invoice';
      const currency = 'PKR';
    const formatCurrency = (amount) => `${currency} ${(Number(amount || 0)).toFixed(2)}`;
     const paymentMethodLabel = payment.method || payment.paymentMethod;
      const paypalEmail = payment.paypalEmail;
    
     return {
        subject: `Booking Confirmation & Invoice - ${hotel.name || 'Hotel'} (${booking.id || booking._id})`,
      html: `
         <!DOCTYPE html>
          <html>
        <head>
           <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
             .header { background-color: #FF385C; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
            .invoice-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
             .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
             .button { display: inline-block; padding: 12px 24px; background-color: #FF385C; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              .price-breakdown { margin: 15px 0; }
            .price-item { display: flex; justify-content: space-between; padding: 5px 0; }
             .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            </style>
        </head>
         <body>
            <div class="container">
            <div class="header">
               <h1>🎉 Booking Confirmed!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation is confirmed</p>
            </div>
             <div class="content">
                <p>Dear ${customer.name},</p>
              <p style="font-size: 16px; color: #28a745; font-weight: bold;">✅ Your booking has been confirmed and payment has been processed successfully!</p>
               <p>We're excited to host you! Please find your booking confirmation and invoice details below:</p>
              
              <div class="invoice-details">
                 <h2>Booking Information</h2>
                  <div class="detail-row">
                  <strong>Booking ID:</strong>
                   <span>${booking.id || booking._id}</span>
                  </div>
                <div class="detail-row">
                   <strong>Hotel:</strong>
                    <span>${hotel.name || 'Hotel'}</span>
                </div>
                 <div class="detail-row">
                    <strong>Check-in:</strong>
                  <span>${checkIn}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Check-out:</strong>
                   <span>${checkOut}</span>
                  </div>
                <div class="detail-row">
                   <strong>Nights:</strong>
                    <span>${nights}</span>
                </div>
                 <div class="detail-row">
                    <strong>Guests:</strong>
                  <span>${booking.guests || 1}</span>
                 </div>
                
                <h3 style="margin-top: 20px;">Price Breakdown</h3>
                 <div class="price-breakdown">
                    <div class="price-item">
                    <span>Base Price (${nights} nights):</span>
                     <span>${formatCurrency(booking.priceSnapshot?.basePriceTotal)}</span>
                    </div>
                  ${booking.priceSnapshot?.cleaningFee ? `
                   <div class="price-item">
                      <span>Cleaning Fee:</span>
                    <span>${formatCurrency(booking.priceSnapshot.cleaningFee)}</span>
                   </div>
                    ` : ''}
                  ${booking.priceSnapshot?.serviceFee ? `
                   <div class="price-item">
                      <span>Service Fee:</span>
                    <span>${formatCurrency(booking.priceSnapshot.serviceFee)}</span>
                   </div>
                    ` : ''}
                  ${booking.priceSnapshot?.discounts > 0 ? `
                   <div class="price-item" style="color: #28a745;">
                      <span>Discount (${booking.priceSnapshot.couponCode || 'Coupon'}):</span>
                    <span>- ${formatCurrency(booking.priceSnapshot.discounts)}</span>
                   </div>
                    ` : ''}
                  <div class="price-item total">
                     <span>Total:</span>
                      <span>${formatCurrency(payment.amount)}</span>
                  </div>
                 </div>
                
                <div class="detail-row" style="margin-top: 15px;">
                   <strong>Payment Method:</strong>
                    <span>${paymentMethodLabel}</span>
                </div>
                 ${paypalEmail ? `
                  <div class="detail-row">
                  <strong>PayPal Email:</strong>
                   <span>${paypalEmail}</span>
                  </div>
                ` : ''}
                 <div class="detail-row">
                    <strong>Transaction ID:</strong>
                  <span>${payment.transactionId || 'N/A'}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Payment Date:</strong>
                   <span>${new Date(payment.processedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
              </div>
              
                <p><strong>Hotel Address:</strong><br>${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}</p>
              
               ${downloadLink ? `
                <p style="text-align: center; margin: 20px 0;">
                <a href="${downloadLink}" class="button">${downloadCtaLabel}</a>
               </p>
                ` : ''}
              
               <p>We look forward to hosting you!</p>
              
              <p>Best regards,<br>The BookSmart Team</p>
             </div>
              <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
             </div>
            </div>
        </body>
         </html>
        `,
      text: `Invoice

Dear ${customer.name},

Thank you for your booking! Your payment has been processed successfully.

Booking Information:
- Booking ID: ${booking.id || booking._id}
- Hotel: ${hotel.name || 'Hotel'}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights}
- Guests: ${booking.guests || 1}

Price Breakdown:
- Base Price: ${formatCurrency(booking.priceSnapshot?.basePriceTotal)}
${booking.priceSnapshot?.cleaningFee ? `- Cleaning Fee: ${formatCurrency(booking.priceSnapshot.cleaningFee)}\n` : ''}
${booking.priceSnapshot?.serviceFee ? `- Service Fee: ${formatCurrency(booking.priceSnapshot.serviceFee)}\n` : ''}
${booking.priceSnapshot?.discounts > 0 ? `- Discount: -${formatCurrency(booking.priceSnapshot.discounts)}\n` : ''}
- Total: ${formatCurrency(payment.amount)}

Payment Method: ${paymentMethodLabel}
${paypalEmail ? `PayPal Email: ${paypalEmail}\n` : ''}
Transaction ID: ${payment.transactionId || 'N/A'}
Payment Date: ${new Date(payment.processedAt || Date.now()).toLocaleDateString()}

Hotel Address: ${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

${downloadLink ? `${downloadCtaLabel}: ${downloadLink}` : ''}

We look forward to hosting you!

Best regards,
The BookSmart Team`
     };
    },

   cancellationEmail: (booking, hotel, customer, refundAmount = null) => {
      const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();
     const nights = booking.nights || 1;
      const cancelledAt = booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString() : new Date().toLocaleDateString();
    const currency = 'PKR';
     const formatCurrency = (amount) => `${currency} ${(Number(amount || 0)).toFixed(2)}`;
    
    return {
       subject: `Booking Cancelled - ${hotel.name || 'Hotel'} (${booking.id || booking._id})`,
        html: `
        <!DOCTYPE html>
         <html>
          <head>
          <style>
             body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
             .content { padding: 20px; background-color: #f9f9f9; }
              .cancellation-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
             .detail-row:last-child { border-bottom: none; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .refund-box { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 15px 0; }
             .refund-amount { font-size: 24px; font-weight: bold; color: #155724; }
            </style>
        </head>
         <body>
            <div class="container">
            <div class="header">
               <h1>Booking Cancelled</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation has been cancelled</p>
            </div>
             <div class="content">
                <p>Dear ${customer.name},</p>
              <p>We're sorry to inform you that your booking has been cancelled. Please find the cancellation details below:</p>
              
                <div class="cancellation-details">
                <h2>Booking Information</h2>
                 <div class="detail-row">
                    <strong>Booking ID:</strong>
                  <span>${booking.id || booking._id}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Hotel:</strong>
                   <span>${hotel.name || 'Hotel'}</span>
                  </div>
                <div class="detail-row">
                   <strong>Check-in:</strong>
                    <span>${checkIn}</span>
                </div>
                 <div class="detail-row">
                    <strong>Check-out:</strong>
                  <span>${checkOut}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Nights:</strong>
                   <span>${nights}</span>
                  </div>
                <div class="detail-row">
                   <strong>Guests:</strong>
                    <span>${booking.guests || 1}</span>
                </div>
                 <div class="detail-row">
                    <strong>Cancelled On:</strong>
                  <span>${cancelledAt}</span>
                 </div>
                  ${booking.cancellationPolicyApplied ? `
                <div class="detail-row">
                   <strong>Cancellation Policy:</strong>
                    <span>${booking.cancellationPolicyApplied}</span>
                </div>
                 ` : ''}
                </div>

               ${refundAmount !== null && refundAmount > 0 ? `
                <div class="refund-box">
                <h3 style="margin-top: 0; color: #155724;">Refund Information</h3>
                 <p>Your refund has been processed:</p>
                  <div class="refund-amount">${formatCurrency(refundAmount)}</div>
                <p style="margin-bottom: 0; font-size: 14px; color: #666;">
                   The refund will be processed to your original payment method within 3-5 business days.
                  </p>
              </div>
               ` : ''}
              
              <p><strong>Hotel Address:</strong><br>${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}</p>
              
                <p>If you have any questions or would like to make a new booking, please don't hesitate to contact us.</p>
              
               <p>We hope to serve you again in the future.</p>
              
              <p>Best regards,<br>The BookSmart Team</p>
             </div>
              <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
             </div>
            </div>
        </body>
         </html>
        `,
      text: `Booking Cancelled

Dear ${customer.name},

We're sorry to inform you that your booking has been cancelled.

Booking Information:
- Booking ID: ${booking.id || booking._id}
- Hotel: ${hotel.name || 'Hotel'}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights}
- Guests: ${booking.guests || 1}
- Cancelled On: ${cancelledAt}
${booking.cancellationPolicyApplied ? `- Cancellation Policy: ${booking.cancellationPolicyApplied}\n` : ''}

${refundAmount !== null && refundAmount > 0 ? `Refund Information:
Your refund of ${formatCurrency(refundAmount)} has been processed and will be credited to your original payment method within 3-5 business days.

` : ''}Hotel Address: ${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

If you have any questions or would like to make a new booking, please don't hesitate to contact us.

We hope to serve you again in the future.

Best regards,
The BookSmart Team`
    };
   },

  hotelSuspensionEmail: (hotel, owner, reason = '') => {
     return {
        subject: `Hotel Suspended - ${hotel.name || 'Your Hotel'}`,
      html: `
         <!DOCTYPE html>
          <html>
        <head>
           <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
             .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
            .suspension-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
             .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
            .reason-box { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 15px 0; }
             .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
         <body>
            <div class="container">
            <div class="header">
               <h1>Hotel Suspended</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Your hotel listing has been suspended</p>
            </div>
             <div class="content">
                <p>Dear ${owner.name || 'Hotel Owner'},</p>
              <p>We regret to inform you that your hotel listing has been suspended by our administration team.</p>
              
                <div class="suspension-details">
                <h2>Hotel Information</h2>
                 <div class="detail-row">
                    <strong>Hotel Name:</strong>
                  <span>${hotel.name || 'Hotel'}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Hotel ID:</strong>
                   <span>${hotel.id || hotel._id}</span>
                  </div>
                <div class="detail-row">
                   <strong>Suspension Date:</strong>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
               </div>
              
              ${reason ? `
               <div class="reason-box">
                  <h3 style="margin-top: 0; color: #856404;">Reason for Suspension:</h3>
                <p style="margin: 0; color: #856404; white-space: pre-wrap;">${reason}</p>
               </div>
                ` : ''}
              
               <p><strong>What this means:</strong></p>
                <ul>
                <li>Your hotel listing is no longer visible to customers</li>
                 <li>No new bookings can be made for your hotel</li>
                  <li>Existing confirmed bookings will remain valid</li>
              </ul>
              
                <p><strong>Next Steps:</strong></p>
              <p>If you believe this suspension was made in error, or if you have addressed the issues mentioned above, please contact our support team to discuss reinstatement of your hotel listing.</p>
              
                <p>We appreciate your understanding and cooperation.</p>
              
               <p>Best regards,<br>The BookSmart Administration Team</p>
              </div>
            <div class="footer">
               <p>This is an automated email. Please do not reply.</p>
              </div>
          </div>
         </body>
          </html>
      `,
       text: `Hotel Suspended

Dear ${owner.name || 'Hotel Owner'},

We regret to inform you that your hotel listing has been suspended by our administration team.

Hotel Information:
- Hotel Name: ${hotel.name || 'Hotel'}
- Hotel ID: ${hotel.id || hotel._id}
- Suspension Date: ${new Date().toLocaleDateString()}

${reason ? `Reason for Suspension:\n${reason}\n\n` : ''}
What this means:
- Your hotel listing is no longer visible to customers
- No new bookings can be made for your hotel
- Existing confirmed bookings will remain valid

Next Steps:
If you believe this suspension was made in error, or if you have addressed the issues mentioned above, please contact our support team to discuss reinstatement of your hotel listing.

We appreciate your understanding and cooperation.

Best regards,
The BookSmart Administration Team`
     };
    },

   hotelApprovalEmail: (hotel, owner) => {
      return {
      subject: `Hotel Approved - ${hotel.name || 'Your Hotel'}`,
       html: `
          <!DOCTYPE html>
        <html>
         <head>
            <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
             .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
             .approval-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
             .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 15px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
         </head>
          <body>
          <div class="container">
             <div class="header">
                <h1>Hotel Approved!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your hotel listing has been approved</p>
             </div>
              <div class="content">
              <p>Dear ${owner.name || 'Hotel Owner'},</p>
               <p>Great news! Your hotel listing has been approved by our administration team and is now live on our platform.</p>
              
              <div class="success-box">
                 <h3 style="margin-top: 0; color: #155724;">✓ Your hotel is now visible to customers!</h3>
                  <p style="margin: 0; color: #155724;">Customers can now view and book your hotel.</p>
              </div>
              
                <div class="approval-details">
                <h2>Hotel Information</h2>
                 <div class="detail-row">
                    <strong>Hotel Name:</strong>
                  <span>${hotel.name || 'Hotel'}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Hotel ID:</strong>
                   <span>${hotel.id || hotel._id}</span>
                  </div>
                <div class="detail-row">
                   <strong>Approval Date:</strong>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
                 <div class="detail-row">
                    <strong>Location:</strong>
                  <span>${hotel.location?.city || ''}, ${hotel.location?.country || ''}</span>
                 </div>
                </div>
              
               <p><strong>What's next?</strong></p>
                <ul>
                <li>Your hotel is now searchable and bookable by customers</li>
                 <li>You can manage bookings, reviews, and earnings from your dashboard</li>
                  <li>Make sure to keep your hotel information and availability up to date</li>
                <li>Respond promptly to booking requests and customer inquiries</li>
               </ul>
              
              <p>We're excited to have you on our platform and look forward to helping you grow your business!</p>
              
                <p>Best regards,<br>The BookSmart Administration Team</p>
            </div>
             <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
            </div>
           </div>
          </body>
        </html>
       `,
        text: `Hotel Approved!

Dear ${owner.name || 'Hotel Owner'},

Great news! Your hotel listing has been approved by our administration team and is now live on our platform.

✓ Your hotel is now visible to customers!

Hotel Information:
- Hotel Name: ${hotel.name || 'Hotel'}
- Hotel ID: ${hotel.id || hotel._id}
- Approval Date: ${new Date().toLocaleDateString()}
- Location: ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

What's next?
- Your hotel is now searchable and bookable by customers
- You can manage bookings, reviews, and earnings from your dashboard
- Make sure to keep your hotel information and availability up to date
- Respond promptly to booking requests and customer inquiries

We're excited to have you on our platform and look forward to helping you grow your business!

Best regards,
The BookSmart Administration Team`
      };
  },

    userSuspensionEmail: (user, reason = '') => {
    return {
       subject: `Account Suspended - BookSmart`,
        html: `
        <!DOCTYPE html>
         <html>
          <head>
          <style>
             body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
             .content { padding: 20px; background-color: #f9f9f9; }
              .suspension-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
             .detail-row:last-child { border-bottom: none; }
              .reason-box { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
           </style>
          </head>
        <body>
           <div class="container">
              <div class="header">
              <h1>Account Suspended</h1>
               <p style="margin: 10px 0 0 0; font-size: 16px;">Your account has been suspended</p>
              </div>
            <div class="content">
               <p>Dear ${user.name || 'User'},</p>
                <p>We regret to inform you that your account has been suspended by our administration team.</p>
              
               <div class="suspension-details">
                  <h2>Account Information</h2>
                <div class="detail-row">
                   <strong>Account Email:</strong>
                    <span>${user.email || 'N/A'}</span>
                </div>
                 <div class="detail-row">
                    <strong>Suspension Date:</strong>
                  <span>${new Date().toLocaleDateString()}</span>
                 </div>
                </div>
              
               ${reason ? `
                <div class="reason-box">
                <h3 style="margin-top: 0; color: #856404;">Reason for Suspension:</h3>
                 <p style="margin: 0; color: #856404; white-space: pre-wrap;">${reason}</p>
                </div>
              ` : ''}
              
                <p><strong>What this means:</strong></p>
              <ul>
                 <li>You will not be able to log in to your account</li>
                  <li>You cannot make new bookings</li>
                <li>You cannot create or manage hotel listings</li>
                 <li>Existing confirmed bookings may be affected</li>
                </ul>
              
               <p><strong>Next Steps:</strong></p>
                <p>If you believe this suspension was made in error, or if you have addressed the issues mentioned above, please contact our support team to discuss reinstatement of your account.</p>
              
               <p>We appreciate your understanding and cooperation.</p>
              
              <p>Best regards,<br>The BookSmart Administration Team</p>
             </div>
              <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
             </div>
            </div>
        </body>
         </html>
        `,
      text: `Account Suspended

Dear ${user.name || 'User'},

We regret to inform you that your account has been suspended by our administration team.

Account Information:
- Account Email: ${user.email || 'N/A'}
- Suspension Date: ${new Date().toLocaleDateString()}

${reason ? `Reason for Suspension:\n${reason}\n\n` : ''}
What this means:
- You will not be able to log in to your account
- You cannot make new bookings
- You cannot create or manage hotel listings
- Existing confirmed bookings may be affected

Next Steps:
If you believe this suspension was made in error, or if you have addressed the issues mentioned above, please contact our support team to discuss reinstatement of your account.

We appreciate your understanding and cooperation.

Best regards,
The BookSmart Administration Team`
    };
   },

  accountCreatedEmail: (user, role) => {
     const roleDisplayName = role === 'hotel' ? 'Hotel Owner' : role === 'customer' ? 'Customer' : role.charAt(0).toUpperCase() + role.slice(1);
      const welcomeMessage = role === 'hotel' 
      ? 'Welcome to BookSmart! We\'re excited to have you as a host. You can now start creating and managing your hotel listings.'
       : 'Welcome to BookSmart! We\'re excited to have you join our community. Start exploring amazing places to stay!';
    
    const nextSteps = role === 'hotel'
       ? [
            'Complete your profile',
          'Create your first hotel listing',
           'Set up your pricing and availability',
            'Start receiving bookings from travelers'
        ]
       : [
            'Complete your profile',
          'Browse amazing hotels and accommodations',
           'Book your first stay',
            'Share your experiences with reviews'
        ];

      return {
      subject: `Welcome to BookSmart - Your Account Has Been Created!`,
       html: `
          <!DOCTYPE html>
        <html>
         <head>
            <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
             .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #FF385C; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
             .account-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FF385C; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
             .next-steps { background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .next-steps ul { margin: 10px 0; padding-left: 20px; }
            .next-steps li { margin: 8px 0; }
             .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #FF385C; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
         </head>
          <body>
          <div class="container">
             <div class="header">
                <h1>🎉 Welcome to BookSmart!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your account has been successfully created</p>
             </div>
              <div class="content">
              <p>Dear ${user.name || 'User'},</p>
               <p style="font-size: 16px; color: #28a745; font-weight: bold;">✅ Your account has been successfully created!</p>
                <p>${welcomeMessage}</p>
              
               <div class="account-details">
                  <h2>Account Information</h2>
                <div class="detail-row">
                   <strong>Name:</strong>
                    <span>${user.name || 'N/A'}</span>
                </div>
                 <div class="detail-row">
                    <strong>Email:</strong>
                  <span>${user.email || 'N/A'}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Account Type:</strong>
                   <span>${roleDisplayName}</span>
                  </div>
                <div class="detail-row">
                   <strong>Account Created:</strong>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
               </div>
              
              <div class="next-steps">
                 <h3 style="margin-top: 0; color: #2e7d32;">Next Steps:</h3>
                  <ul>
                  ${nextSteps.map(step => `<li>${step}</li>`).join('')}
                 </ul>
                </div>
              
               <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>We're thrilled to have you on board!</p>
              
                <p>Best regards,<br>The BookSmart Team</p>
            </div>
             <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
            </div>
           </div>
          </body>
        </html>
       `,
        text: `Welcome to BookSmart!

Dear ${user.name || 'User'},

✅ Your account has been successfully created!

${welcomeMessage}

Account Information:
- Name: ${user.name || 'N/A'}
- Email: ${user.email || 'N/A'}
- Account Type: ${roleDisplayName}
- Account Created: ${new Date().toLocaleDateString()}

Next Steps:
${nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

If you have any questions or need assistance, please don't hesitate to contact our support team.

We're thrilled to have you on board!

Best regards,
The BookSmart Team`
     };
    },

   rescheduleEmail: (booking, hotel, customer, oldCheckIn, oldCheckOut, oldNights) => {
      const newCheckIn = new Date(booking.checkIn).toLocaleDateString();
    const newCheckOut = new Date(booking.checkOut).toLocaleDateString();
     const newNights = booking.nights || 1;
      const oldCheckInStr = new Date(oldCheckIn).toLocaleDateString();
    const oldCheckOutStr = new Date(oldCheckOut).toLocaleDateString();
    
      return {
      subject: `Booking Rescheduled - ${hotel.name || 'Hotel'} (${booking.id || booking._id})`,
       html: `
          <!DOCTYPE html>
        <html>
         <head>
            <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
             .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
             .reschedule-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FF9800; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
             .change-box { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 15px 0; }
              .old-dates { color: #856404; text-decoration: line-through; }
            .new-dates { color: #155724; font-weight: bold; }
             .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .price-breakdown { margin: 15px 0; }
            .price-item { display: flex; justify-content: space-between; padding: 5px 0; }
           </style>
          </head>
        <body>
           <div class="container">
              <div class="header">
              <h1>📅 Booking Rescheduled</h1>
               <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation dates have been updated</p>
              </div>
            <div class="content">
               <p>Dear ${customer.name || 'Customer'},</p>
                <p style="font-size: 16px; color: #FF9800; font-weight: bold;">✅ Your booking has been successfully rescheduled!</p>
              <p>Your booking dates have been updated. Please find the details below:</p>
              
                <div class="change-box">
                <h3 style="margin-top: 0; color: #856404;">Date Changes:</h3>
                 <p style="margin: 5px 0;"><strong>Previous Dates:</strong> <span class="old-dates">${oldCheckInStr} to ${oldCheckOutStr} (${oldNights} ${oldNights === 1 ? 'night' : 'nights'})</span></p>
                  <p style="margin: 5px 0;"><strong>New Dates:</strong> <span class="new-dates">${newCheckIn} to ${newCheckOut} (${newNights} ${newNights === 1 ? 'night' : 'nights'})</span></p>
              </div>
              
                <div class="reschedule-details">
                <h2>Updated Booking Information</h2>
                 <div class="detail-row">
                    <strong>Booking ID:</strong>
                  <span>${booking.id || booking._id}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Hotel:</strong>
                   <span>${hotel.name || 'Hotel'}</span>
                  </div>
                <div class="detail-row">
                   <strong>Check-in:</strong>
                    <span>${newCheckIn}</span>
                </div>
                 <div class="detail-row">
                    <strong>Check-out:</strong>
                  <span>${newCheckOut}</span>
                 </div>
                  <div class="detail-row">
                  <strong>Nights:</strong>
                   <span>${newNights} ${newNights === 1 ? 'night' : 'nights'}</span>
                  </div>
                <div class="detail-row">
                   <strong>Guests:</strong>
                    <span>${booking.guests || 1} ${booking.guests === 1 ? 'guest' : 'guests'}</span>
                </div>
                
                  ${booking.priceSnapshot ? `
                <h3 style="margin-top: 20px;">Updated Price Breakdown</h3>
                 <div class="price-breakdown">
                    <div class="price-item">
                    <span>Base Price (${newNights} nights):</span>
                     <span>PKR ${(booking.priceSnapshot.basePriceTotal || 0).toFixed(2)}</span>
                    </div>
                  ${booking.priceSnapshot.cleaningFee > 0 ? `
                   <div class="price-item">
                      <span>Cleaning Fee:</span>
                    <span>PKR ${(booking.priceSnapshot.cleaningFee || 0).toFixed(2)}</span>
                   </div>
                    ` : ''}
                  ${booking.priceSnapshot.serviceFee > 0 ? `
                   <div class="price-item">
                      <span>Service Fee:</span>
                    <span>PKR ${(booking.priceSnapshot.serviceFee || 0).toFixed(2)}</span>
                   </div>
                    ` : ''}
                  <div class="price-item">
                     <span>Subtotal:</span>
                      <span>PKR ${(booking.priceSnapshot.subtotal || 0).toFixed(2)}</span>
                  </div>
                   ${booking.priceSnapshot.discounts > 0 ? `
                    <div class="price-item">
                    <span>Discount:</span>
                     <span>-PKR ${(booking.priceSnapshot.discounts || 0).toFixed(2)}</span>
                    </div>
                  ` : ''}
                   <div class="price-item" style="font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
                      <span>Total:</span>
                    <span>PKR ${(booking.priceSnapshot.totalPrice || booking.totalPrice || 0).toFixed(2)}</span>
                   </div>
                  </div>
                ` : `
                 <div class="detail-row">
                    <strong>Total Price:</strong>
                  <span>PKR ${(booking.totalPrice || 0).toFixed(2)}</span>
                 </div>
                  `}
              </div>
              
                <p><strong>Hotel Address:</strong><br>${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}</p>
              
               <p><strong>Important Notes:</strong></p>
                <ul>
                <li>Your booking has been updated with the new dates</li>
                 ${booking.invoicePath ? '<li>A new invoice has been generated with the updated dates and pricing</li>' : ''}
                  <li>Please make a note of your new check-in and check-out dates</li>
                <li>If you have any questions, please contact our support team</li>
               </ul>
              
              <p>We look forward to hosting you on your new dates!</p>
              
                <p>Best regards,<br>The BookSmart Team</p>
            </div>
             <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
            </div>
           </div>
          </body>
        </html>
       `,
        text: `Booking Rescheduled

Dear ${customer.name || 'Customer'},

✅ Your booking has been successfully rescheduled!

Date Changes:
Previous Dates: ${oldCheckInStr} to ${oldCheckOutStr} (${oldNights} ${oldNights === 1 ? 'night' : 'nights'})
New Dates: ${newCheckIn} to ${newCheckOut} (${newNights} ${newNights === 1 ? 'night' : 'nights'})

Updated Booking Information:
- Booking ID: ${booking.id || booking._id}
- Hotel: ${hotel.name || 'Hotel'}
- Check-in: ${newCheckIn}
- Check-out: ${newCheckOut}
- Nights: ${newNights} ${newNights === 1 ? 'night' : 'nights'}
- Guests: ${booking.guests || 1} ${booking.guests === 1 ? 'guest' : 'guests'}
- Total Price: PKR ${(booking.priceSnapshot?.totalPrice || booking.totalPrice || 0).toFixed(2)}

Hotel Address: ${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

Important Notes:
- Your booking has been updated with the new dates
${booking.invoicePath ? '- A new invoice has been generated with the updated dates and pricing\n' : ''}- Please make a note of your new check-in and check-out dates
- If you have any questions, please contact our support team

We look forward to hosting you on your new dates!

Best regards,
The BookSmart Team`
      };
  }
};

module.exports = {
   sendEmail,
    emailTemplates
};

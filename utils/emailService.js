const nodemailer = require('nodemailer');

// Fallback user specified by owner for notifications
const OWNER_EMAIL = 'patelutsav312@gmail.com';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || OWNER_EMAIL,
      pass: process.env.EMAIL_PASS || '',
    },
    // Prevent long hanging sockets
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 3000
  });
};

// Send mail with strict timeout race so API calls never hang!
const sendMail = async ({ to, subject, html }) => {
  // Check if destination is fake/temp domain
  const isFakeEmail = !to || to.includes('@example.com') || to.includes('@test.com') || to.includes('@fake') || to.includes('temp');
  const destinationEmail = isFakeEmail ? OWNER_EMAIL : to;

  const mailOptions = {
    from: `"Cappsra Air Trips" <${process.env.EMAIL_USER || OWNER_EMAIL}>`,
    to: destinationEmail,
    subject,
    html,
  };

  // Fast timeout promise race (2.5s max wait)
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.log(`⏰ Email send timeout (2.5s limit reached) for ${destinationEmail} - resolving gracefully.`);
      resolve({ success: false, timedOut: true });
    }, 2500);
  });

  const sendPromise = (async () => {
    try {
      if (!process.env.EMAIL_PASS) {
        console.log(`ℹ️ EMAIL_PASS not configured in ENV. Simulated email sent to ${destinationEmail}.`);
        return { success: true, simulated: true };
      }
      const transporter = createTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ Email sent to ${destinationEmail} [Id: ${info.messageId}]`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Nodemailer error to ${destinationEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  })();

  return Promise.race([sendPromise, timeoutPromise]);
};

// 1. Welcome Email with 3 Free Coupons
exports.sendWelcomeEmail = async (user, coupons = []) => {
  const couponsHtml = coupons.map(c => `
    <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 12px; padding: 16px; margin-bottom: 12px; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin: 0; font-size: 18px; font-weight: bold;">${c.title}</h4>
        <span style="background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 20px; font-weight: bold; font-family: monospace;">${c.code}</span>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${c.description}</p>
    </div>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #0f172a, #1e3a8a); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">✈️ CAPPSRA AIR TRIPS</h1>
        <p style="margin: 8px 0 0 0; color: #93c5fd; font-size: 16px;">Discover • Plan • Go</p>
      </div>
      
      <div style="padding: 32px; background-color: white;">
        <h2 style="color: #0f172a; margin-top: 0;">Welcome aboard, ${user.name}! 🎉</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Thank you for creating an account with <strong>Cappsra Air Trips</strong>. We are thrilled to welcome you to our luxury flight and travel booking platform!
        </p>

        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 18px;">🎁 Your Exclusive 3 Welcome Free Discount Coupons</h3>
          <p style="margin: 0; color: #1e3a8a; font-size: 14px;">As a special welcome gift, Cappsra has credited 3 free discount coupons to your profile:</p>
        </div>

        ${couponsHtml}

        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/coupons" style="background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View & Use Your Coupons</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Cappsra Air Trips. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: 'Welcome to Cappsra Air Trips! ✈️ Here are your 3 Free Discount Coupons',
    html
  });
};

// 2. Password Reset Email
exports.sendResetPasswordEmail = async (user, resetUrl) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #0f172a, #1e3a8a); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">✈️ CAPPSRA AIR TRIPS</h1>
        <p style="margin: 8px 0 0 0; color: #93c5fd; font-size: 16px;">Password Reset Request</p>
      </div>
      
      <div style="padding: 32px; background-color: white;">
        <h2 style="color: #0f172a; margin-top: 0;">Hello ${user.name},</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          You requested to reset your password for your Cappsra Air Trips account. Click the button below to specify a new password:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset My Password</a>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
          If the button above does not work, copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>

        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
          This link will expire in 1 hour. If you did not request a password reset, please ignore this email.
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Cappsra Air Trips. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: '🔒 Reset Your Cappsra Air Trips Password',
    html
  });
};

// 3. Festival / Vacation Bonus Coupons Email
exports.sendFestivalBonusEmail = async (user, festivalName, coupons = []) => {
  const couponsHtml = coupons.map(c => `
    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 12px; padding: 16px; margin-bottom: 12px; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin: 0; font-size: 18px; font-weight: bold;">${c.title}</h4>
        <span style="background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 20px; font-weight: bold; font-family: monospace;">${c.code}</span>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${c.description}</p>
    </div>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #065f46, #059669); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">🎉 ${festivalName.toUpperCase()} BONUS TRIPS</h1>
        <p style="margin: 8px 0 0 0; color: #a7f3d0; font-size: 16px;">Cappsra Air Trips Special Gift</p>
      </div>
      
      <div style="padding: 32px; background-color: white;">
        <h2 style="color: #0f172a; margin-top: 0;">Happy ${festivalName}, ${user.name}! 🎆</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          To celebrate the season of <strong>${festivalName}</strong>, Cappsra Air Trips has rewarded you with <strong>2 Free Bonus Discount Coupons</strong>!
        </p>

        ${couponsHtml}

        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/coupons" style="background-color: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Claim & Redeem Now</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Cappsra Air Trips. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: `🎁 You received ${festivalName} Bonus Trip Coupons from Cappsra!`,
    html
  });
};

// 4. Subscription Purchase Confirmation Email
exports.sendSubscriptionEmail = async (user, subscriptionName, amount, coupons = []) => {
  const couponsHtml = coupons.map(c => `
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 12px; padding: 16px; margin-bottom: 12px; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin: 0; font-size: 18px; font-weight: bold;">${c.title}</h4>
        <span style="background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 20px; font-weight: bold; font-family: monospace;">${c.code}</span>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${c.description}</p>
    </div>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #4c1d95, #7c3aed); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">👑 SUBSCRIPTION CONFIRMED</h1>
        <p style="margin: 8px 0 0 0; color: #ddd6fe; font-size: 16px;">${subscriptionName}</p>
      </div>
      
      <div style="padding: 32px; background-color: white;">
        <h2 style="color: #0f172a; margin-top: 0;">Thank you for your purchase, ${user.name}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your <strong>${subscriptionName}</strong> for <strong>₹${amount}</strong> has been successfully processed. Here is your itemized list of attached premium trip coupons:
        </p>

        ${couponsHtml}

        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/coupons" style="background-color: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Access Coupon Locker</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Cappsra Air Trips. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: `💳 Receipt: ${subscriptionName} Activated - Cappsra Air Trips`,
    html
  });
};

const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        pass: pass.trim().replace(/\s+/g, ''), // remove any spaces in 16-char app password
      },
    });
  }
  return transporter;
};

/**
 * Send an OTP verification email to user's Gmail
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} userName - Name of recipient
 * @param {string} purpose - Purpose of OTP ('password_reset' | 'verification')
 */
const sendOtpEmail = async (toEmail, otpCode, userName = 'MedZoo User', purpose = 'password_reset') => {
  const tx = getTransporter();

  const title = purpose === 'password_reset' 
    ? 'Password Reset Request' 
    : 'Account Verification Code';

  const subtitle = purpose === 'password_reset'
    ? 'We received a request to reset your password for your MedZoo account.'
    : 'Please use the verification code below to complete your MedZoo sign up.';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:500px;background-color:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 24px 32px;text-align:center;background:linear-gradient(135deg,#4f46e5,#6366f1,#818cf8);">
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">🏥 MedZoo</h1>
                    <p style="margin:6px 0 0 0;color:rgba(255,255,255,0.9);font-size:13px;font-weight:500;">Smart Healthcare Platform</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px 0;font-size:16px;color:#e2e8f0;">Hello <strong>${userName}</strong>,</p>
                    <p style="margin:0 0 24px 0;font-size:14px;color:#94a3b8;line-height:1.6;">${subtitle}</p>

                    <!-- OTP Box -->
                    <div style="background-color:#0f172a;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                      <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:600;">Your 6-Digit Code</p>
                      <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#818cf8;font-family:'SF Mono',Consolas,Monaco,monospace;">
                        ${otpCode}
                      </div>
                      <p style="margin:10px 0 0 0;font-size:12px;color:#f59e0b;font-weight:500;">⏱️ Valid for 10 minutes only</p>
                    </div>

                    <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;line-height:1.5;">
                      If you did not request this code, you can safely ignore this email. Your password will not change.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;background-color:#0f172a;border-top:1px solid #334155;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#64748b;">
                      &copy; ${new Date().getFullYear()} MedZoo Healthcare Platform • Automated System Email
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!tx) {
    console.log(`\n========================================================`);
    console.log(`🔑 [MedZoo Mailer] Real Gmail credentials not set in backend/.env`);
    console.log(`   To send real emails, add EMAIL_USER and EMAIL_PASS in .env`);
    console.log(`   Recipient : ${toEmail}`);
    console.log(`   OTP Code  : ${otpCode}`);
    console.log(`========================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await tx.sendMail({
      from: `"MedZoo Healthcare" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${title} - ${otpCode} (MedZoo)`,
      html: htmlContent,
    });
    console.log(`📧 [MedZoo Mailer] Real OTP email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [MedZoo Mailer] Error sending email via Nodemailer:', error);
    // Fallback: log to console so development never breaks
    console.log(`🔑 [Fallback Console OTP] To: ${toEmail} | Code: ${otpCode}`);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOtpEmail };

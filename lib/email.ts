import "server-only";
import { Resend } from "resend";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  displayName?: string
) {
  // Check if Resend is configured
  if (!resend) {
    console.warn("RESEND_API_KEY not configured. Skipping email send.");
    console.log(`Password reset link for ${to}: ${resetUrl}`);
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Delibration <onboarding@resend.dev>",
      to: [to],
      subject: "Reset Your Password - Delibration",
      html: getPasswordResetEmailTemplate(resetUrl, displayName),
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error };
  }
}

function getPasswordResetEmailTemplate(
  resetUrl: string,
  displayName?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                Reset Your Password
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; color: #4a5568; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 16px 0;">
                ${displayName ? `Hi ${displayName},` : "Hi,"}
              </p>
              <p style="margin: 0 0 16px 0;">
                We received a request to reset your password for your Delibration account. Click the button below to create a new password:
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 30px 40px;" align="center">
              <a href="${resetUrl}"
                 style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 30px 40px; color: #4a5568; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 16px 0;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; word-break: break-all; color: #2563eb;">
                ${resetUrl}
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #fef3c7; border-radius: 6px; margin: 0 20px;">
              <p style="margin: 16px 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; color: #718096; font-size: 14px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0;">
                Think in threads, learn in layers
              </p>
              <p style="margin: 0;">
                © ${new Date().getFullYear()} Delibration. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
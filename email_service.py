"""
email_service.py — Email verification and notification service for JanDrishti GovTech.
Supports real SMTP (Gmail, SendGrid, Amazon SES, etc.) with automatic fallback
to local development / sandbox mode when credentials are not configured.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config

def is_smtp_configured() -> bool:
    """Returns True if live SMTP outbound host & user credentials are present."""
    return bool(config.SMTP_HOST and config.SMTP_USER and config.SMTP_PASSWORD)

def send_verification_email(email: str, code: str, purpose: str = "login") -> dict:
    """
    Sends a 6-digit verification code to the user's email address.
    If SMTP is not configured, logs the code in dev sandbox mode.
    """
    subject = f"Your JanDrishti Verification Code: {code}"
    purpose_title = {
        "login": "Sign In to JanDrishti",
        "register": "Activate Your Citizen Account",
        "verify": "Verify Your Email Address"
    }.get(purpose, "Verification Code")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color: #07162C; padding: 24px 32px; border-bottom: 2px solid #FF9933;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td>
                  <span style="font-size: 11px; font-weight: 800; color: #FF9933; letter-spacing: 0.1em; text-transform: uppercase;">
                    भारत सरकार · Government of India
                  </span>
                  <h1 style="color: #ffffff; font-size: 20px; margin: 6px 0 0 0; font-weight: 700;">
                    JanDrishti AI Contract & Scheme Advisor
                  </h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px;">
            <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">{purpose_title}</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
              Use the single-use 6-digit verification code below to complete your authentication. This code will expire in <strong>10 minutes</strong>.
            </p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px dashed #cbd5e1;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f3d68;">
                {code}
              </span>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0;">
              If you did not request this verification code, you can safely ignore this email. Never share this code with anyone.
            </p>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">100% In-Country Sovereign Processing · DPDP Act 2023 Compliant</p>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    # If live SMTP configured, attempt real email transmission
    if is_smtp_configured():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = config.SMTP_FROM
            msg["To"] = email
            msg.attach(MIMEText(f"Your JanDrishti verification code is: {code}\nExpires in 10 minutes.", "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if config.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
            else:
                server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
                if config.SMTP_USE_TLS:
                    server.starttls()

            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.sendmail(config.SMTP_FROM, [email], msg.as_string())
            server.quit()
            print(f"[Email Service] Verification email successfully delivered to {email}")
            return {
                "success": True,
                "delivered": True,
                "dev_mode": False,
                "message": f"Verification code sent to {email}"
            }
        except Exception as e:
            print(f"[Email Service Warning] SMTP delivery failed ({e}). Falling back to sandbox mode.")
            return {
                "success": True,
                "delivered": False,
                "dev_mode": True,
                "code": code,
                "message": f"Verification code generated (sandbox mode): {code}"
            }

    # Dev / Local sandbox mode
    print(f"\n========================================================")
    print(f" [AUTH EMAIL SANDBOX] Verification Code for {email}: {code}")
    print(f" Purpose: {purpose} | Valid for 10 minutes")
    print(f"========================================================\n")

    return {
        "success": True,
        "delivered": False,
        "dev_mode": True,
        "code": code,
        "message": f"Verification code generated in sandbox mode: {code}"
    }

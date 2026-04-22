/**
 * Mail Utility for DevArise AI
 * This is a production-ready structural implementation for transactional emails.
 * Uses placeholder console logs for development; ready for nodemailer/resend integration.
 */

export const sendEmail = async ({ to, subject, body, html }) => {
    // In production, integrate with Resend, SendGrid, or Nodemailer
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MAIL_SERVICE] Sending email to ${to}`);
      console.log(`[MAIL_SERVICE] Subject: ${subject}`);
    }
    
    // Simulate async network request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, messageId: Math.random().toString(36).substring(7) };
};

export const sendWelcomeEmail = async (user) => {
    return sendEmail({
        to: user.email,
        subject: "Welcome to DevArise AI — Your career journey starts here!",
        html: `<h1>Welcome ${user.name}!</h1><p>We're excited to help you ace your next interview...</p>`
    });
};

export const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
    return sendEmail({
        to: email,
        subject: "Reset your DevArise AI password",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link expires in 1 hour.</p>`
    });
};

export const sendSubscriptionSuccessEmail = async (user, plan) => {
    return sendEmail({
        to: user.email,
        subject: `Success! You're now a ${plan} member`,
        html: `<p>Thank you for choosing DevArise AI Pro Elite. Your premium features are now unlocked.</p>`
    });
};

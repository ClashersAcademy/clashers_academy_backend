import Mail from "nodemailer/lib/mailer";
import transporter from "../../configs/emails";
import { config } from "dotenv";

config()

export default class EmailServices {
    /**
     * Sends an email to the specified address.
     * @param to - The recipient's email address.
     * @param subject - The email subject.
     * @param text - The plain text body of the email.
     * @param html - The HTML body of the email.
     */
    static async sendMail(to: string | Mail.Address | (string | Mail.Address)[], subject: string, html: string) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM, // sender address
                to,
                subject,
                html,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Sends a magic link to user.
     * @param to - The recipient's email address.
     * @param magicLink - The magic link.
     */
    static async sendMagicLink(to: string, magicLink: string) {
        try {
            const subject = 'Your Magic Link';
            const html = `<p>Click <a href="${magicLink}">here</a> to log in.</p>`;

            await this.sendMail(to, subject, html)
        } catch (error) {
            throw error;
        }
    }
    /**
     * Sends a account threat to user.
     * @param to - The recipient's email address.
     * @param location - The account threat.
     */
    static async sendLoginThreat(to: string, location?: string) {
        try {
            const subject = 'Your account in under threat';
            const html = `<p>Someone is accessing you account.</p>`;

            await this.sendMail(to, subject, html)
        } catch (error) {
            throw error;
        }
    }

    /**
     * Sends a welcome email to a new student.
     * @param to - The recipient's email address.
     * @param name - The recipient's name.
     */
    static async sendWelcomeStudentEmail(to: string) {
        const subject = "Welcome to Our Service!";
        const html = `
        <p>Hi Clasher</p>
        <p>Welcome to our service! We're excited to have you on board.</p>
        <p>If you have any questions or need assistance, feel free to reach out to us.</p>
        <p>Best regards,<br/>The Clashers Academy Team</p>
    `;
        await this.sendMail(to, subject, html);
    }

    /**
     * Sends an invitation email to the specified address.
     * @param to - The recipient's email address.
     * @param inviteLink - The invitation link.
     */
    static async sendInviteEmail(to: string, inviteLink: string) {
        const subject = "You're Invited!";
        const html = `<p>Hello,</p><p>You have been invited to join our platform. Click the link below to accept the invitation:</p><p><a href="${inviteLink}">Join Now</a></p>`;
        await this.sendMail(to, subject, html);
    }

    /**
     * Sends a password reset email to the specified address.
     * @param to - The recipient's email address.
     * @param resetLink - The password reset link.
     */
    static async sendPasswordResetEmail(to: string, resetLink: string) {
        const subject = "Password Reset Request";
        const html = `<p>Hello,</p><p>We received a request to reset your password. Click the link below to reset it:</p><p><a href="${resetLink}">Reset Password</a></p>`;
        await this.sendMail(to, subject, html);
    }

    /**
     * Sends an email verification message to the specified address.
     * @param to - The recipient's email address.
     * @param verificationLink - The email verification link.
     */
    static async sendEmailVerification(to: string, verificationLink: string) {
        try {
            const subject = "Verify Your Email Address";
            const html = `<p>Hello,</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationLink}">Verify Email</a></p>`;
            await this.sendMail(to, subject, html);
        } catch (error) {
            throw error
        }
    }
}
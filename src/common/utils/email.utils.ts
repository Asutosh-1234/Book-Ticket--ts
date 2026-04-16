import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

class Email{
    static async registrationEmail(email:string,token:string){
        resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Registration',
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; border-radius: 10px;">
                <h1>Welcome to our platform</h1>
                <p>Please verify your email address by clicking on the link below:</p>
                <div style="margin: 20px 0; text-align: center;">
                    <a href="${process.env.VERIFICATION_URL}/verify-email?token=${token}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                </div>
                <p>If you did not register for this email, please ignore this email.</p>
                <p>Thank you for using our platform.</p>
            </div>
            `
        });
    }

    static async seatConformationEmail(email:string,seat: string){
        resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Seat Conformation',
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; border-radius: 10px;">
                <h1>Seat Conformation</h1>
                <p>Your seat has been confirmed</p>
                <p>Seat Number: ${seat}</p>
                <p>Thank you for using our platform.</p>
            </div>
            `
        });
    }
}

export default Email;

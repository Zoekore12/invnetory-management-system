const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const mailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

mailTransporter.verify((error, success) => {
    if (error) {
        console.error("Gmail SMTP connection failed:");
        console.error(error);
    } else {
        console.log("Gmail SMTP server is ready");
    }
});

const sendEmailVerificationCode = async (email, code) => {
    try {
        console.log("Preparing to send email...");
        console.log("Recipient:", email);
        console.log("Verification code:", code);

        const info = await mailTransporter.sendMail({
            from: `"Inventory System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify your email",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: auto;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                ">

                    <h2>Email Verification</h2>

                    <p>
                        Thank you for creating an account.
                        Please use the verification code below
                        to verify your email address.
                    </p>

                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        text-align: center;
                        margin: 30px 0;
                    ">
                        ${code}
                    </div>

                    <p>
                        This code will expire in 5 minutes.
                    </p>

                    <p>
                        If you did not create this account,
                        you can ignore this email.
                    </p>

                </div>
            `
        });

    

        return info;

    } catch (error) {
        console.error("SEND EMAIL ERROR:");
        console.error(error);

        throw error;
    }
};

module.exports = {
    sendEmailVerificationCode
};
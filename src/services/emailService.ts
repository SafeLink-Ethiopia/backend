import nodemailer from "nodemailer";

export const sendAdvisorResetOtp = async (
  email: string,
  advisorName: string,
  otp: string,
): Promise<void> => {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = Number(process.env.EMAIL_PORT || 587);
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;

  if (!emailHost || !emailUser || !emailPassword || !emailFrom) {
    throw new Error(
      "Email configuration is incomplete. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  await transporter.sendMail({
    from: `"SafeLink" <${emailFrom}>`,
    to: email,
    subject: "SafeLink Password Reset OTP",

    text: `Hello ${advisorName},

We received a request to reset your SafeLink advisor account password.

Your verification code is:

${otp}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

SafeLink Team`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>SafeLink Password Reset</h2>

        <p>Hello ${advisorName},</p>

        <p>
          We received a request to reset your SafeLink advisor account password.
        </p>

        <p>Your verification code is:</p>

        <h1 style="letter-spacing: 8px;">${otp}</h1>

        <p>
          This code will expire in <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore this
          email.
        </p>

        <p>SafeLink Team</p>
      </div>
    `,
  });
};

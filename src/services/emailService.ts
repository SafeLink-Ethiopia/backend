import nodemailer from "nodemailer";

const emailHost = process.env.EMAIL_HOST;
const emailPort = Number(process.env.EMAIL_PORT || 587);
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const senderName = process.env.EMAIL_SENDER_NAME || "SafeLink";

if (!emailHost || !emailUser || !emailPassword) {
  console.warn(
    "Email configuration is incomplete. Check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD.",
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

export const sendAdvisorCredentials = async (
  email: string,
  advisorName: string,
  advisorId: string,
  temporaryPassword: string,
): Promise<void> => {
  if (!emailHost || !emailUser || !emailPassword) {
    throw new Error(
      "Email configuration is incomplete. Check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD.",
    );
  }

  await transporter.sendMail({
    from: `"${senderName}" <${emailUser}>`,
    to: email,
    subject: "SafeLink Advisor Account",
    text: `Hello ${advisorName},

Your SafeLink advisor account has been created.

Your login credentials are:

Advisor ID:
${advisorId}

Temporary Password:
${temporaryPassword}

Please use these credentials to log in to SafeLink.

You will be required to change your temporary password after your first login.

If you did not expect this account, please contact the SafeLink administrator.

SafeLink Team`,
    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        "
      >
        <h2>SafeLink Advisor Account</h2>

        <p>Hello ${advisorName},</p>

        <p>
          Your SafeLink advisor account has been created successfully.
        </p>

        <p>Your login credentials are:</p>

        <div
          style="
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          "
        >
          <p>
            <strong>Advisor ID:</strong>
            ${advisorId}
          </p>

          <p>
            <strong>Temporary Password:</strong>
            ${temporaryPassword}
          </p>
        </div>

        <p>
          Please use these credentials to log in to SafeLink.
        </p>

        <p>
          You will be required to change your temporary password
          after your first login.
        </p>

        <p>
          If you did not expect this account, please contact the
          SafeLink administrator.
        </p>

        <p>SafeLink Team</p>
      </div>
    `,
  });
};

export const sendAdvisorResetOtp = async (
  email: string,
  advisorName: string,
  otp: string,
): Promise<void> => {
  if (!emailHost || !emailUser || !emailPassword) {
    throw new Error(
      "Email configuration is incomplete. Check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD.",
    );
  }

  await transporter.sendMail({
    from: `"${senderName}" <${emailUser}>`,
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
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        "
      >
        <h2>SafeLink Password Reset</h2>

        <p>Hello ${advisorName},</p>

        <p>
          We received a request to reset your SafeLink advisor
          account password.
        </p>

        <p>Your verification code is:</p>

        <div
          style="
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          "
        >
          <h1 style="letter-spacing: 8px;">
            ${otp}
          </h1>
        </div>

        <p>
          This code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

        <p>SafeLink Team</p>
      </div>
    `,
  });
};

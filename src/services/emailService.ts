import { BrevoClient } from "@getbrevo/brevo";

const brevoApiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME || "SafeLink";

if (!brevoApiKey || !senderEmail) {
  console.warn(
    "Brevo configuration is incomplete. Check BREVO_API_KEY and BREVO_SENDER_EMAIL.",
  );
}

const brevoClient = brevoApiKey
  ? new BrevoClient({
      apiKey: brevoApiKey,
    })
  : null;

export const sendAdvisorCredentials = async (
  email: string,
  advisorName: string,
  advisorId: string,
  temporaryPassword: string,
): Promise<void> => {
  if (!brevoClient || !senderEmail) {
    throw new Error(
      "Brevo configuration is incomplete. Check BREVO_API_KEY and BREVO_SENDER_EMAIL.",
    );
  }

  await brevoClient.transactionalEmails.sendTransacEmail({
    subject: "SafeLink Advisor Account",
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email,
        name: advisorName,
      },
    ],
    textContent: `Hello ${advisorName},

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
    htmlContent: `
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
  if (!brevoClient || !senderEmail) {
    throw new Error(
      "Brevo configuration is incomplete. Check BREVO_API_KEY and BREVO_SENDER_EMAIL.",
    );
  }

  await brevoClient.transactionalEmails.sendTransacEmail({
    subject: "SafeLink Password Reset OTP",
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email,
        name: advisorName,
      },
    ],
    textContent: `Hello ${advisorName},

We received a request to reset your SafeLink advisor account password.

Your verification code is:

${otp}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

SafeLink Team`,
    htmlContent: `
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

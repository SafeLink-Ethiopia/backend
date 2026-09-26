import "dotenv/config";
import nodemailer from "nodemailer";

const testEmail = async (): Promise<void> => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM;

  console.log("SMTP host:", host);
  console.log("SMTP port:", port);
  console.log("SMTP user:", user);
  console.log("SMTP password:", password ? "SET" : "MISSING");
  console.log("SMTP from:", from);

  if (!host || !user || !password || !from) {
    console.error("Email environment variables are incomplete.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass: password,
    },
  });

  try {
    console.log("Testing SMTP connection...");

    await transporter.verify();

    console.log("SMTP authentication successful!");

    await transporter.sendMail({
      from: `"SafeLink Test" <${from}>`,
      to: from,
      subject: "SafeLink Gmail Test",
      text: "This is a test email from the SafeLink backend.",
    });

    console.log("Test email sent successfully!");
  } catch (error) {
    console.error("Email test failed:");
    console.error(error);
  }
};

testEmail();
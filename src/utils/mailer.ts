// import nodemailer from "nodemailer";

// export const mailer = nodemailer.createTransport({
//   host: process.env.SMTP_HOST!,
//   port: Number(process.env.SMTP_PORT!),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER!,
//     pass: process.env.SMTP_PASS!,
//   },
// });

// export async function sendSchoolAdminCredentials(opts: {
//   to: string;
//   schoolCode: string;
//   password: string;
// }) {
//   const { to, schoolCode, password } = opts;

//   await mailer.sendMail({
//     from: `"School Manage" <${process.env.SMTP_USER}>`,
//     to,
//     subject: "Your School Admin Account Credentials",
//     text: `
// Hello,

// Your school account has been created.

// School Code: ${schoolCode}
// Login Email: ${to}
// Temporary Password: ${password}

// Please log in and change your password immediately.

// Login URL: ${process.env.APP_LOGIN_URL}
// `,
//   });
// }


import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

interface SendSchoolAdminCredentialsArgs {
  to: string;
  schoolCode: string;
  password: string;
}

// export const sendSchoolAdminCredentials = async ({
//   to,
//   schoolCode,
//   password,
// }: SendSchoolAdminCredentialsArgs) => {
//   await resend.emails.send({
//     from: process.env.EMAIL_FROM!,
//     to,
//     subject: "Your School Admin Account Credentials",
//     html: `
//       <h2>Welcome to School ID System</h2>
//       <p>Your school has been registered successfully.</p>
//       <p><strong>School Code:</strong> ${schoolCode}</p>
//       <p><strong>Temporary Password:</strong> ${password}</p>
//       <p>Please login and change your password immediately.</p>
//     `,
//   });
// };

export const sendSchoolAdminCredentials = async ({
  to,
  schoolCode,
  password,
}: SendSchoolAdminCredentialsArgs) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: "Your School Admin Account Credentials",
      html: `
        <h2>Welcome to School ID System</h2>
        <p>Your school has been registered successfully.</p>
        <p><strong>School Code:</strong> ${schoolCode}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please login and change your password immediately.</p>
      `,
    });

    console.log("📧 Email sent:", response);
  } catch (error) {
    console.error("❌ Email failed:", error);
    throw error;
  }
};

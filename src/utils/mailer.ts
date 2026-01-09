import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export async function sendSchoolAdminCredentials(opts: {
  to: string;
  schoolCode: string;
  password: string;
}) {
  const { to, schoolCode, password } = opts;

  await mailer.sendMail({
    from: `"School Manage" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your School Admin Account Credentials",
    text: `
Hello,

Your school account has been created.

School Code: ${schoolCode}
Login Email: ${to}
Temporary Password: ${password}

Please log in and change your password immediately.

Login URL: ${process.env.APP_LOGIN_URL}
`,
  });
}

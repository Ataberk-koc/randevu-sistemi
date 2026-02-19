import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"ATA Kreatif Merkezi" <${process.env.EMAIL_USER}>`, // Buraya işletme adını yazabilirsin
      to,
      subject,
      html,
    });
    console.log("E-posta başarıyla gönderildi:", to);
  } catch (error) {
    console.error("E-posta gönderim hatası:", error);
  }
}
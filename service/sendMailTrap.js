require('dotenv').config();
const { MailtrapClient } = require("mailtrap");
const fs = require("fs").promises;
const path = require("path");

const TOKEN = process.env.MAILTRAP_TOKEN;
const SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL;
const EMAILS_FILE = path.join(__dirname, "../health_emails.json");

const client = new MailtrapClient({ token: TOKEN });
const sender = { name: "Thông Báo Tình Trạng Website", email: SENDER_EMAIL };

// Đọc danh sách email từ file
async function getRecipientEmails() {
  try {
    const data = await fs.readFile(EMAILS_FILE, "utf-8");
    const emails = JSON.parse(data);
    return emails.length > 0 ? emails : [];
  } catch {
    return [];
  }
}

async function sendErrorEmailMailtrap(subject, message, failedUrl, type) {
  const recipientEmails = await getRecipientEmails();

  if (recipientEmails.length === 0) {
    console.log("[Mailtrap] Không có email nhận thông báo nào được cấu hình. Bỏ qua gửi mail.");
    return;
  }

  console.log("[Mailtrap] Preparing to send email to:", recipientEmails);

  const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const isRecovery = type === "recovery";
  const statusLabel = isRecovery ? "ĐÃ PHỤC HỒI" : "ĐANG GẶP LỖI";
  const statusColor = isRecovery ? "#27ae60" : "#e74c3c";
  const statusIcon = isRecovery ? "✅" : "❌";

  const htmlContent = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
  <h2 style="color: ${statusColor}; margin-bottom: 5px;">${statusIcon} ${statusLabel}</h2>
  <hr style="border: none; border-top: 1px solid #ddd;" />
  <table style="border-collapse: collapse; margin-top: 10px;">
    <tr>
      <td style="padding: 6px 12px; font-weight: bold;">Website:</td>
      <td style="padding: 6px 12px;"><a href="${failedUrl}">${failedUrl}</a></td>
    </tr>
    <tr>
      <td style="padding: 6px 12px; font-weight: bold;">Trạng thái:</td>
      <td style="padding: 6px 12px; color: ${statusColor}; font-weight: bold;">${statusLabel}</td>
    </tr>
    <tr>
      <td style="padding: 6px 12px; font-weight: bold;">Chi tiết:</td>
      <td style="padding: 6px 12px;">${message}</td>
    </tr>
    <tr>
      <td style="padding: 6px 12px; font-weight: bold;">Thời gian:</td>
      <td style="padding: 6px 12px;">${now}</td>
    </tr>
  </table>
  <hr style="border: none; border-top: 1px solid #ddd; margin-top: 15px;" />
  <p style="font-size: 12px; color: #999;">Email tự động từ hệ thống Health Check. Vui lòng không trả lời email này.</p>
</div>`;

  const textContent = [
    `[${statusLabel}]`,
    `Website: ${failedUrl}`,
    `Chi tiết: ${message}`,
    `Thời gian: ${now}`,
  ].join("\n");

  const recipients = recipientEmails.map(email => ({ email }));

  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject,
      text: textContent,
      html: htmlContent,
    });
    console.log("[Mailtrap] Email sent:", response);
  } catch (error) {
    console.error("[Mailtrap] Error:", error);
  }
}

module.exports = sendErrorEmailMailtrap;
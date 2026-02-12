
require('dotenv').config();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

async function sendErrorEmail(subject, message) {


  const msg = {
    to: 'khanh0915815121@gmail.com',
    from: 'gkhanh0706@gmail.com',
    subject: subject,
    text: message,
    html: `<strong>${subject}</strong><p>${message}</p>`,
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error('Failed to send error email', error);
    });
}
module.exports = sendErrorEmail;
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'anthonycolle84@gmail.com',
    subject: 'Thanks for joining in',
    text: `Welcome to the app, ${name}`
  })
}

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'anthonycolle84@gmail.com',
    subject: 'Thanks for having used our app',
    text: `We're sad to see you leave ${name}. Is there anything we could do?`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
}

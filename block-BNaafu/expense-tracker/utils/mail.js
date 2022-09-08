var nodemailer = require("nodemailer")
var sgmail = require("@sendgrid/mail");


module.exports = {
    generateOtp: () => {
        let otp = '';
        for (let i = 0; i < 4; i++) {
            otp += Math.floor(Math.random() * 9);
        }
        return otp;
    },
    // mailTransport: () =>
    //     nodemailer.createTransport({
    //         host: "smtp.mailtrap.io",
    //         port: 2525,
    //         auth: {
    //             user: process.env.MAILTRAP_USERNAME,
    //             pass: process.env.MAILTRAP_PASSWORD,
    //         },
    //         // service: 'Gmail',
    //         // auth: {
    //         //     user: 'vikas264802@gmail.com',
    //         //     pass: 'prernasharma1'
    //         // }
    //     }),
    mailTransport: (email, newToken) => {
        sgmail.setApiKey(process.env.SENDGRID_API_KEY);
        let msg = {
            to: email,
            form: 'homosapien2489@gmail.com',
            subject: "Verify Your Email Account To Access Expense-tracker",
            html: `<a href = "http://localhost:3000/verify/${newToken.owner}/${newToken.token}" > Verify Your Email By Clicking Here On This Button </a>`
        };
        sgmail.send(msg).then((response) => { console.log("email sent....") }).catch(err => {
            console.log(err);
        })
    }
}
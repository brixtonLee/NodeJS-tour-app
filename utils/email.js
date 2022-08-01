const nodemailer = require('nodemailer');

// Since in normal js file we dont have the access to the response because we are not in middleware, hence we require pug
const pug = require('pug');

// Convert HTML to text
const htmlToText = require('html-to-text');
module.exports = class Email {
    constructor(user, url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.form = `Brixton Lee ${process.env.EMAIL_FROM}`
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            //Send Grid

        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
    
            // Activate the "less secure app" option
             
        })
    }

    // Send the actual email
    async send(template, subject){
    //    1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        })
    // 2) Define email options
        const mailOptions = {
            from: this.form,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
            // html: 
        }
        // 3) Create a transport and send email
        
        await this.newTransport().sendMail(mailOptions);

    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the natours family')
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your passwor reset token (valid for 10mins)')
    }
}

// const sendEmail = async options => {
//     // Steps To Send Email

//     // 1) Create the transporter
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }

//         // Activate the "less secure app" option
         
//     })
//     // 2) Define the email options
//     const mailOptions = {
//         from: 'Brixton Lee <brixton@brixton.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//         // html: 
//     }

//     // 3) Send the email with nodemailer
//     await transporter.sendMail(mailOptions);
// }

// module.exports = sendEmail;
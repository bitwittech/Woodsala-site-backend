require('dotenv').config()

// This file has our mailing client 
const { SendMailClient } = require("zeptomail");

// creating the client
const url = process.env.MAIL_URL
const token = process.env.MAIL_TOKEN
// console.log(url,token)
const client = new SendMailClient({ url, token });

// extra info call like
// sendMail({
//     recipient_mail : "yashwantsahu3002@gmail.com",
//     recipient_name : "Yashwant Sahu",
//     subject : "For test",
//     mailBody : "For test", 
//   })

// "template_key": "ea36f19a.2bec9ad9c994ee6f.k1.7207ab80-da56-11eb-850c-525400256d50.17a6198be38",
exports.sendMail = async (data)=> {
    try {

        let response  = await client.sendMail({
            "bounce_address": "aayush.kothari@bounce.woodshala.com",
            "from":
            {
                "address": process.env.MAILING_ADDRESS,
                "name": "WoodShala"
            },
            "to":
                [
                    {
                        "email_address":
                        {
                            "address": data.recipient_mail,
                            "name": data.recipient_name
                        }
                    }
                ],
            "subject": data.subject,
            "htmlbody": data.mailBody,
        })
        if(response) return { message: "Email has been sent successfully.",response }


    } catch (error) {
        console.log("Error >>>", error.error.details)
        return { message: "Email Client Failed !!!", error }
    }

}

require('dotenv').config();
const nodemailer = require('nodemailer');
const moment = require('moment');
const weather = require('yahoo-weather');

const sendTo = 'zach@zachkrall.com <zach@zachkrall.com>';

const todayIs = moment().format('dddd, MMMM D');
const weatherLocation = 'Brooklyn, NY';

var forecast;

function getSuggestion( temp ) {
  if( temp > 80 ){
    return 'It\'s hot today *sweats*';
  } else if ( temp > 70 ){
    return 'It\'s warm today.';
  } else if ( temp > 50 ){
    return 'Bring a sweater.';
  } else if ( temp > 40 ){
    return 'It\'s chilly!';
  } else if ( temp < 39 ){
    return 'You will need a jacket!';
  }else {
    return '';
  }
}

const getWeather = weather(weatherLocation, 'f').then(data => {
    
  forecast = {
    temp: data.item.condition.temp + '°F',
    tempSuggestion: getSuggestion( data.item.condition.temp ),
    high: data.item.forecast[0].high + '°F', 
    low: data.item.forecast[0].low + '°F',
    condition: data.item.condition.text,
    windspeed: data.wind.speed + ' mph',
    humidity: data.atmosphere.humidity
  };
  
}).catch(err => {
  
  console.log(err);
  
});


var emailBody;
var emailSubject;

Promise.all([getWeather]).then(function() {
  
  emailSubject = `Daily email for ${todayIs}`;

  emailBody = `Today is ${todayIs} and this is your daily briefing.

In ${weatherLocation} it is currently ${forecast.temp} and ${forecast.condition}. ${forecast.tempSuggestion}
High: ${forecast.high}
Low: ${forecast.low}
Windspeed: ${forecast.windspeed}
Humidity: ${forecast.humidity}% ${forecast.humidity > 43 ? 'Yikes 😬' : ''}
`;
  
  console.log('subject: \n' + emailSubject);
  console.log('---------------');
  console.log('body: \n' + emailBody);
  
});

// let transporter = nodemailer.createTransport(
//         {
//             host: process.env.EMAIL_SMTPHOST,
//             port: process.env.EMAIL_SMTPPORT,
//             auth: {
//                 user: process.env.EMAIL_USERNAME,
//                 pass: process.env.EMAIL_PASSWORD
//             },
//             logger: false,
//             debug: false // include SMTP traffic in the logs
//         }
// );

// let mailOptions = {
//     from: 'krallbot@hackermail.com', // sender address
//     to: sendTo, // list of receivers
//     subject: 'Hello ✔', // Subject line
//     text: emailBody, // plain text body
//     // html: '<b>Hello world?</b>' // html body
// };

// console.log(emailBody);

// transporter.verify(function(error, success) {
//    if (error) {
//         console.log('=== did not work :( ===');
//         console.log(error);
//    } else {
//         console.log('Server is ready to take our messages');
//    }
// });

// send mail with defined transport object
// transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//         return console.log(error);
//     }
//     console.log('Message sent: %s', info.messageId);
//     // Preview only available when sending through an Ethereal account
//     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

//     // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
//     // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
// });
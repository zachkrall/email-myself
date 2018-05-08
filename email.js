require('dotenv').config();
const nodemailer = require('nodemailer');
const moment = require('moment');
const weather = require('yahoo-weather');
var MTA = require('mta-service-status');
var h2p = require('html2plaintext')

// const sendTo = '"Zach Krall" <zach@zachkrall.com>';
const sendTo = process.env.EMAIL_USERNAME;
const todayIs = moment().format('dddd, MMMM D');
const weatherLocation = 'Brooklyn, NY';

let transporter = nodemailer.createTransport(
        {
            host: process.env.EMAIL_SMTPHOST,
            port: process.env.EMAIL_SMTPPORT,
            sure: process.env.EMAIL_SECURE,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            },
            logger: false,
            debug: true // include SMTP traffic in the logs
        }
);

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
  } else {
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

var MTAL, MTAM;

var subwayL = MTA.getServiceStatus('subway', 'L').then(result => {
    MTAL = result;
}).catch(err => {
    MTAL = 'error fetching L train data';
});
var subwayM = MTA.getServiceStatus('subway', 'M').then(result => {
    MTAM = result;
}).catch(err => {
    MTAM = 'error fetching M train data';
});

var emailBody;
var emailSubject;
var htmlEmail;
var mailOptions;

transporter.verify(function(error, success) {
   if (error) {
        console.log('=== did not work :( ===');
        console.log(error);
   } else {
        console.log('Server is ready to take our messages');
   }
});

Promise.all([getWeather, subwayM, subwayL]).then(function() {

  emailSubject = 'Something is not working';
//
//   emailBody = `<table>
// <tr><td>
// <h1>Good morning!</h1>
// </td></tr>
// <tr><td>
// <h2>Today is ${todayIs}</h2>
// </td></tr>
// <tr><td>
// In ${weatherLocation} it is currently ${forecast.temp} and ${forecast.condition}. ${forecast.tempSuggestion}
//
// High: ${forecast.high}
// Low: ${forecast.low}
// Windspeed: ${forecast.windspeed}
// Humidity: ${forecast.humidity}% ${forecast.humidity > 55 ? 'Yikes' : ''}
//
// L Train ${ '[ ' + MTAL.status + ' ]'}${ h2p(MTAL.html) }
// M Train ${ '[ ' + MTAM.status + ' ]'}${ h2p(MTAM.html) }
// </td></tr>
// </table>`;

  emailBody = `<table align="center" border="0" cellpadding="0" cellspacing="0" width="600px" style="border-collapse: collapse;">
  <tr>
   <td style="padding:30px 0;">
    <span>${todayIs}</span>
    <h1 style="color:#0000FF;">Today is going to be amazing.</h1>
   </td>
  </tr>
  <tr>
   <td>

    It is currently <b>${forecast.temp}</b> (${forecast.condition}).

  </td></tr>
  <tr><td style="padding:40px 0;">
    <b>High</b><br>${forecast.high}
    <br><br><b>Low</b><br>${forecast.low}
    <br><br><b>Windspeed</b><br>${forecast.windspeed}
    <br><br><b>Humidity</b><br>${forecast.humidity}% ${forecast.humidity > 55 ? 'Yikes' : ''}
   </td>
  </tr>
  <tr><td style="padding:10px 0 40px 0;">
    <h2 style="margin-bottom:7px;color:#9a9a9a;">Trains</h2>
    <span style="display:inline-block;width:2em;height:2em;background:#9D9FA2;line-height:2em;text-align:center;font-weight:bold;color:#ffffff;border-radius:50%;margin-right:5px;">L</span>${ '[ ' + MTAL.status + ' ]'}${ MTAL.html && '<br><br>' + h2p(MTAL.html)}
    <br><br><span style="display:inline-block;width:2em;height:2em;background:#F55818;line-height:2em;text-align:center;font-weight:bold;color:#ffffff;border-radius:50%;margin-right:5px;">M</span>${ '[ ' + MTAM.status + ' ]'}${ MTAM.html && '<br><br>' + h2p(MTAM.html) }
  </td></tr>
  </table>`;

  htmlEmail = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Test Email Sample</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  *{
    margin:0 auto;padding:0;
  }
  body{
    font-family:sans-serif;
  }
  b{
    color:#9A9A9A;
  }
</style>
</head>
<body>
${emailBody}
</body>
</html>`.replace(/(?:\r\n|\r|\n)/g, '');

// console.log('plaintext body: \n\n' + emailBody + '\n\n');
// console.log('html full: \n\n' + htmlEmail + '\n\n');

  mailOptions = {
      from: '"krall bot" <krallbot@hackermail.com>', // sender address
      to: process.env.EMAIL_USERNAME, // list of receivers
      subject: emailSubject, // Subject line
      text: h2p(emailBody), // plain text body
      html: htmlEmail // html body
  };

// console.log(mailOptions);

}).then( function(){

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error(error);
      }
      console.log('Message sent: %s', info.messageId);
  });

});

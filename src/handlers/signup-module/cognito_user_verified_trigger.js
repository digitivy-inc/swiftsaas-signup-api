const AWS = require('aws-sdk');

exports.cognitouserverified = async(event,context) => {

    var email = {'email':event.request.userAttributes.email};
    var verified_email = JSON.stringify(email);
    var sns   = new AWS.SNS({apiVersion: '2010-03-31'});
    const email_verified_topic = process.env.Email_verified_Topic;

    let verified_email_params = {
        Message     :   verified_email,
        Subject     :   'User email is verifed successfully.',
        TopicArn    :   email_verified_topic
    };

    try{
        var email_verified = await sns.publish(verified_email_params).promise();
        console.log(email+" is confirmed..")
        console.log(email_verified);
    }catch(err){
        console.log(err);
    }

    context.done(null,event);

};
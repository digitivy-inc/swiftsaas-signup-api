const AWS = require('aws-sdk');
const Response = (statusCode,body)=>{
    return {
        'statusCode' : statusCode,
        'body'       : JSON.stringify(body),
        headers    : {
            'Content-Type':'application/json',
            'Access-Control-Allow-Origin':'*'
        }
    }
};

exports.inviteusercheck = async(event)=>{
    var input_data  = event.queryStringParameters; 
    var userpool_id = input_data.userpoolid;
    var username    = input_data.email;

    var params = {
        UserPoolId: userpool_id, 
        Username: username
    }

    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
      
    try{
        var check_user = await cognitoidentityserviceprovider.adminGetUser(params).promise();
        console.log(check_user);
        var response = {'statuscode':400,'body':'User already existed with these detials.'};
        return Response(400,response);
    }catch(err){
        console.log(err);
        var response1 = {'stauscode':200,'body':'user not exists.'};
        return Response(400,response1);
    }

};
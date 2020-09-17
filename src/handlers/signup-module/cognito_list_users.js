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

exports.cognitolistusers = async(event)=>{

    var params = {
        UserPoolId : 'us-east-1_BWvk0HWeR', /* required */
        AttributesToGet: ['sub','name','email','phone_number','email_verified','phone_number_verified']
      };

      var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});

      try{        
        var get_user_list = await cognitoidentityserviceprovider.listUsers(params).promise();
        var response1 = {'statuscode':200,'body':get_user_list};
        console.log(get_user_list);
        return Response(200,response1);
      }catch(err){
        var response2 = {'statuscode':400,'body':err};
        console.log(err);
        return Response(400,response2);
      }
};
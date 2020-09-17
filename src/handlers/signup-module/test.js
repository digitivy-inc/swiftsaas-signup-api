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

exports.multiinvite = async(event)=>{
    var input_data = JSON.parse(event.body);
    var sent_success=0;

    if(input_data.length<=5){
        
        for(var i=0;i<input_data.length;i++){
            var params = {UserPoolId: 'us-east-1_vIwew6FfL',Username:input_data[i].email,DesiredDeliveryMediums: ['EMAIL'],
            UserAttributes: [{Name:"name",Value:input_data[i].firstname},
                            {Name:"family_name",Value:input_data[i].familyname},
                            {Name:"email",Value:input_data[i].email},
                            {Name:"phone_number",Value:input_data[i].phonenumber},
                            {Name:"email_verified",Value:"true"}]};
    
            var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
            try{
                var admin_create_user = await cognitoidentityserviceprovider.adminCreateUser(params).promise();
                console.log(admin_create_user);
                if(admin_create_user.User.Username!=''){
                    sent_success++;
                }
            }catch(err){
                console.log(err);
            }
        }//for loop end
    
        if(sent_success===input_data.length){
            return Response(200,"invited succesfully...");
        }else{
            return Response(400,'error');
        }

    }else{
        return Response(400,"More than Five user invites not acceptable.")
    }
      
};
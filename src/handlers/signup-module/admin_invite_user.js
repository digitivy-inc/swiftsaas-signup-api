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

exports.admininviteuser = async(event)=>{

    var input_data          = JSON.parse(event.body);
    var sent_success        = 0;

    if(input_data.users.length<=5){
        
      for(var i=0;i<input_data.users.length;i++){
          var params = {UserPoolId: input_data.poolid,Username:input_data.users[i].email,DesiredDeliveryMediums: ['EMAIL'],
          UserAttributes: [{Name:"name",Value:input_data.users[i].firstname},
                          {Name:"family_name",Value:input_data.users[i].familyname},
                          {Name:"email",Value:input_data.users[i].email},
                          {Name:"phone_number",Value:input_data.users[i].phonenumber},
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
  
      if(sent_success===input_data.users.length){
          var res = {'statuscode':200,'body':'invited succesfully'}
          return Response(200,res);
      }else{
          var res1 = {'statuscode':400,'body':'Error'}
          return Response(400,res1);
      }

  }else{
      var res2 = {'statuscode':400,'body':'More than Five user invites not acceptable.'};
      return Response(400,res2);
  }
  

    // var first_name          =  event_data.firstname;
    // var family_name         =  event_data.familyname;
    // var username            =  event_data.email;
    // var phone_number        =  event_data.phonenumber;
    // var userPoolid          =  event_data.userpoolid;

    // var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
    
    // var params = {UserPoolId: userPoolid,Username:username,DesiredDeliveryMediums: ['EMAIL'],
    // UserAttributes: [{Name:"name",Value:first_name},
    //                 {Name:"family_name",Value:family_name},
    //                 {Name:"email",Value:username},
    //                 {Name:"phone_number",Value:phone_number},
    //               {Name:"email_verified",Value:"true"}]};

        
    // try{
    //   var admin_create_user = await cognitoidentityserviceprovider.adminCreateUser(params).promise();
    //   console.log(admin_create_user);
    //   if(admin_create_user.User.Username!=''){
    //     var res1 = {'statuscode':200,'body':'User invited successfully'};
    //     return Response(200,res1);
    //   }
    // }catch(err){
    //   console.log(err);
    //   var err1 = {'statuscode':400,'body':err};
    //   return Response(400,err1); 
    // }
    
};
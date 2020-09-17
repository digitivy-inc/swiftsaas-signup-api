const AWS = require('aws-sdk');
const db = new AWS.DynamoDB();
const { v1: uuidv1 } = require('uuid');
const fs = require('fs');
const stripeapi = require('stripe');
const stripekey = require("../../secrets/stripekeys.json");
const stripe    = new stripeapi(stripekey.secretkey);

exports.createuserpoolanduser = async(event)=>{
  
    const get_sqs_message = JSON.parse(event.Records[0].body);
    const input_data      = JSON.parse(get_sqs_message.body);

    /**Topic Arns */
    const userpool_created          = process.env.Userpool_created_topic;
    const email_verification_sent   = process.env.Email_verification_sent_Topic;
    const cognito_trigger           = process.env.Cognito_Trigger;
    /**Topic Arns ends */
    
    var workspace_name = input_data.short_name;
    var first_name     = input_data.first_name;
    var last_name      = input_data.last_name
    var owner          = input_data.owner;
    var phone_number   = input_data.phonenumber;
    var Password       = input_data.password;
    var org_name       = input_data.org_name;
    const table_name   = process.env.Table_Name;
    var userPoolid,clientid,loginurl;
    
    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});
    var sns                            = new AWS.SNS({apiVersion: '2010-03-31'});
    var lambda                         = new AWS.Lambda({apiVersion: '2015-03-31'});
    //var iam                            = new AWS.IAM({apiVersion: '2010-05-08'});
    var external_id = uuidv1();
    var domainname = workspace_name+external_id;
  
    /** creating user pool */

    var params = {
      PoolName: org_name,
      AccountRecoverySetting: {
        RecoveryMechanisms: [
          {
            Name: 'verified_email',
            Priority: '1'
          }
        ]
      },
      // AdminCreateUserConfig: {
      //   AllowAdminCreateUserOnly: true
      // },
      EmailConfiguration: {
        EmailSendingAccount: 'COGNITO_DEFAULT',
      },
      AutoVerifiedAttributes: [
        'email'
      ],  
      // LambdaConfig: {
      //   PostConfirmation: cognito_trigger
      // },
      MfaConfiguration: 'ON',
      Policies: {
        PasswordPolicy: {
          MinimumLength: '8',
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
          RequireUppercase: true
        }
      },
      Schema: [
      {
          "Name": "name",
          "AttributeDataType": "String",
          "Mutable": false,
          "Required": true
      },
      {
          "Name": "family_name",
          "AttributeDataType": "String",
          "Mutable": false,
          "Required": true
      },
      {
          "Name": "email",
          "AttributeDataType": "String",
          "Mutable": false,
          "Required": true
      },
      {
          "Name": "phone_number",
          "AttributeDataType": "String",
          "Mutable": false,
          "Required": true
      }
      ],
       SmsConfiguration: {
         SnsCallerArn: 'arn:aws:iam::752267975477:role/service-role/swiftsaas-SMS-Role1', /* required snsarn external_id*/
         ExternalId : '43e25f19-e70e-4a19-bde6-cd24093305a7'         
       },
      UsernameAttributes: [
         'email','phone_number'
      ],
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_LINK',
        EmailMessageByLink: 'Hello user,\n We are glad to serve you.\n In order to complete creating your account.\n{##Click Here to Verify email##} ',
        EmailSubjectByLink: 'SwiftSaas Account Creation Verification Mail',
      }
    };
 
      try{
        var create_pool = await cognitoidentityserviceprovider.createUserPool(params).promise()
        let user_pool_dtls = JSON.stringify(create_pool);
        
        var sns_params = {Message:user_pool_dtls,Subject:'userpool is created',TopicArn: userpool_created};
          try{
            var publish_sns_createduserpool = await sns.publish(sns_params).promise();
            console.log("create userpool sns published : "+publish_sns_createduserpool);
          }catch(err){
            console.log(err);
          }
        
        console.log("userpool created successfully. "+create_pool);
        userPoolid = create_pool.UserPool.Id;
        poolarn    = create_pool.UserPool.Arn; 
      }catch(err1){
        console.log(err1);
      }

/** userpool creation ends */

/** userpool invoke lambda trigger access */
  // const generateLambdaPersmission = (poolarn,workspace_name) => {
  //   return {
  //     Action: 'lambda:InvokeFunction',
  //     Principal: 'cognito-idp.amazonaws.com',
  //     SourceArn: poolarn,
  //     FunctionName: cognito_trigger,
  //     StatementId: workspace_name+external_id
  //   };
  // };

  // lambda.addPermission(generateLambdaPersmission(poolarn,workspace_name),(err8,res8)=>{
  //     if(err8){
  //       console.log(err8);
  //     }else{
  //       console.log(res8);
  //     }
  // });

/** userpool invoke lambda trigger access ends */


/**create userpool client */

const params2 = {
  ClientName        : workspace_name,
  UserPoolId        : userPoolid,
  GenerateSecret    : false,
  AllowedOAuthFlows : ['code'],
  AllowedOAuthFlowsUserPoolClient: true,
  AllowedOAuthScopes: ['openid','aws.cognito.signin.user.admin'],
  CallbackURLs: ['https://example.com','https://d16d15bnqqxa8a.cloudfront.net'],
  SupportedIdentityProviders: [
    'COGNITO'
  ]
  //ExplicitAuthFlows : ['ADMIN_NO_SRP_AUTH']
};

try{
  var create_client = await cognitoidentityserviceprovider.createUserPoolClient(params2).promise();
  clientid = create_client.UserPoolClient.ClientId;
  console.log("create client "+create_client);
}catch(err2){
  console.log(err2);
}

/**userpool client creation ends*/


/** create userpool domain */

    var params1 = {
        Domain: domainname,
        UserPoolId: userPoolid,
    }

    try{
      var create_domain = await cognitoidentityserviceprovider.createUserPoolDomain(params1).promise();
      //var login_url = "https://"+domainname+".auth.us-east-1.amazoncognito.com/login?client_id="+clientid+"&response_type=code&scope=aws.cognito.signin.user.admin+openid&redirect_uri=https://example.com";
      var login_url   = "https://"+domainname+".auth.us-east-1.amazoncognito.com/login?client_id="+clientid+"&response_type=code&scope=aws.cognito.signin.user.admin+openid&redirect_uri=https://d16d15bnqqxa8a.cloudfront.net&state="+userPoolid+"";
      loginurl = login_url;
      console.log("Domain created "+create_domain);
      // var short_name  = workspace_name;
      // var firstname   = first_name;
      // var lastname    = last_name;
      // var phonenumber = phone_number;
      // var org_name = org_name;
      // var login_url_indb = {
      //   TableName: table_name,
      //   Key:{short_name : short_name},
      //   Item:{
      //       short_name,
      //       org_name,
      //       owner,
      //       firstname,
      //       lastname,
      //       phonenumber,
      //       login_url
      //   }
      // }
        // try{
        //   var save_login_url = await db.put(login_url_indb).promise();
        //   console.log(save_login_url);
        // }catch(err){
        //   console.log(err);
        // }
      
    }catch(err3){
      console.log(err3);
    }

/**userpool domain creation ends.. */

/**update cognito custome message */
var login_url1 = "https://"+domainname+".auth.us-east-1.amazoncognito.com/login?client_id="+clientid+"&response_type=code&scope=aws.cognito.signin.user.admin+openid&redirect_uri=https://d16d15bnqqxa8a.cloudfront.net&state="+userPoolid+"";
var params5 = {
  UserPoolId: userPoolid, /* required */
  AdminCreateUserConfig: {
    AllowAdminCreateUserOnly: true,
    InviteMessageTemplate: {
      EmailMessage: 'Your username is {username} and temporary password is {####}. please click this link to <a href="'+login_url1+'">Login Here</a>',
      EmailSubject: 'Swiftsaas User Invitation',
      //SMSMessage: ''
    }
    //UnusedAccountValidityDays: 'NUMBER_VALUE'
  }
};

try{
  var update_userpool = await cognitoidentityserviceprovider.updateUserPool(params5).promise();
  console.log("update invite message: "+update_userpool);
}catch(err11){
  console.log("update invite message: "+err11);
}

/**custom message ends */

/**create admin group */

  var create_group_params = {
    GroupName: 'admin', 
    UserPoolId: userPoolid,
    Description: 'This group had admin user detials'
  };

  try{
    var cognito_create_group = await cognitoidentityserviceprovider.createGroup(create_group_params).promise();
    console.log(cognito_create_group);
  }catch(err4){
    console.log(err4);
  }

/**creating group is ended here */

/**set custom ui for userpool */
  var image_data = fs.readFileSync('images/targalogo.png');

  var setcustomparams = {
    UserPoolId: userPoolid, /* required */
  //  CSS: '.logo-customizable {\n\tmax-width: 60%;\n\tmax-height: 30%;\n}\n.banner-customizable {\n\tpadding: 25px 0px 25px 10px;\n\tbackground-color: #fff;\n}\n.label-customizable {\n\tfont-weight: 300;\n\tdisplay: none;\n}\n.textDescription-customizable {\n\tpadding-top: 10px;\n\tpadding-bottom: 10px;\n\tdisplay: block;\n\tfont-size: 16px;\n}\n.idpDescription-customizable {\n\tpadding-top: 10px;\n\tpadding-bottom: 10px;\n\tdisplay: block;\n\tfont-size: 16px;\n}\n.legalText-customizable {\n\tcolor: #747474;\n\tfont-size: 11px;\n}\n.submitButton-customizable {\n\tfont-size: 14px;\n\tfont-weight: bold;\n\tmargin: 20px 0px 10px 0px;\n\theight: 40px;\n\twidth: 100%;\n\tcolor: #fff;\n\tbackground-color: #337ab7;\n}\n.submitButton-customizable:hover {\n\tcolor: #fff;\n\tbackground-color: #286090;\n}\n.errorMessage-customizable {\n\tpadding: 5px;\n\tfont-size: 14px;\n\twidth: 100%;\n\tbackground: #F5F5F5;\n\tborder: 2px solid #D64958;\n\tcolor: #D64958;\n}\n.inputField-customizable {\n\twidth: 100%;\n\theight: 34px;\n\tcolor: #555;\n\tbackground-color: #fff;\n\tborder: 1px solid #ccc;\n\tmargin: 10px 0px;\n}\n.inputField-customizable:focus {\n\tborder-color: #66afe9;\n\toutline: 0;\n}\n.idpButton-customizable {\n\theight: 40px;\n\twidth: 100%;\n\ttext-align: center;\n\tmargin-bottom: 15px;\n\tcolor: #fff;\n\tbackground-color: #5bc0de;\n\tborder-color: #46b8da;\n}\n.idpButton-customizable:hover {\n\tcolor: #fff;\n\tbackground-color: #31b0d5;\n}\n.socialButton-customizable {\n\theight: 40px;\n\ttext-align: left;\n\twidth: 100%;\n\tmargin-bottom: 15px;\n}\n.redirect-customizable {\n\ttext-align: center;\n}\n.passwordCheck-notValid-customizable {\n\tcolor: #DF3312;\n}\n.passwordCheck-valid-customizable {\n\tcolor: #19BF00;\n}\n.background-customizable {\n\tbackground-color: #fff;\n}\n',
    ImageFile: Buffer.from(image_data),
    ClientId: clientid
  };
  
  try{
    var set_custom_ui = await cognitoidentityserviceprovider.setUICustomization(setcustomparams).promise();
    console.log(set_custom_ui);
  }catch(err9){
    console.log(err9)
  }

/**set custom ui is ends */

/**  userpool create user */
    var params4 = {UserPoolId: userPoolid,Username:owner,DesiredDeliveryMediums: ['EMAIL'],
    UserAttributes: [{Name:"name",Value:first_name},
                    {Name:"family_name",Value:last_name},
                    {Name:"email",Value:owner},
                    {Name:"phone_number",Value:phone_number},
                  {Name:"email_verified",Value:"true"}]};

    try{
      var admin_create_user = await cognitoidentityserviceprovider.adminCreateUser(params4).promise();
      console.log(admin_create_user);
    }catch(err10){
      console.log(err10)
    }

 
    // var params3 = {
    //     ClientId: clientid, 
    //     Password:  Password, 
    //     Username:  owner,
    //     UserAttributes: [
    //       {
    //         Name: 'email',
    //         Value: owner
    //       },
    //       {
    //         Name: 'name',
    //         Value: first_name
    //       },
    //       {
    //         Name: 'middle_name',
    //         Value: last_name
    //       },
    //       {
    //         Name : 'phone_number',
    //         Value: phone_number 
    //       }
    //     ]
    // }

    // try{
    //     var create_user = await cognitoidentityserviceprovider.signUp(params3).promise();
        
    //     let verification_sent = JSON.stringify(create_user);
    //     var sns_send_verification_params = {Message:verification_sent,Subject:'User created verification mail sent',TopicArn: email_verification_sent};
    //       try{
    //         var publish_sns_verificationmailsent = await sns.publish(sns_send_verification_params).promise();
    //         console.log("verification mail sent sns published : "+publish_sns_verificationmailsent);
    //       }catch(err5){
    //         console.log(err5);
    //       }
        
    //     console.log(create_user);
    // }catch(err6){ 
    //     console.log(err6);
    // }

/**userpool create user ends */


/**Add user to admin group */
    var add_user_admingroup_params = {
        GroupName: 'admin', 
        UserPoolId: userPoolid, 
        Username: owner 
    };

    try{
        var add_user_admin_group = await cognitoidentityserviceprovider.adminAddUserToGroup(add_user_admingroup_params).promise();
        console.log(add_user_admin_group);
    }catch(err7){
      console.log(err7);
    }

/** */

/**create stripe customer and save id into db */
    try{
      var create_stripe_customer = await stripe.customers.create({
        email : owner
      });
      console.log(create_stripe_customer.id);

      var stripe_params = {
        TableName: table_name,
        Key:{
          'short_name' : {S:workspace_name}
        },
        ExpressionAttributeNames: {
          "#ll"  : "login_url",
          "#cid" : "stripe_customer_id"
        },
        ExpressionAttributeValues: {
          ":lu"  : {
            S : loginurl
          },
          ":sid" : {
            S : create_stripe_customer.id
          }
        },
        UpdateExpression: "SET #ll = :lu, #cid = :sid"
      };
      
      try{
        var save_stripe_id =  await db.updateItem(stripe_params).promise();
        console.log(save_stripe_id);
      }catch(err13){
        console.log(err13)
      }

    }catch(err12){
      console.log(err12)
    }


/**stripe customer create and save ends.. */

    return {};
};
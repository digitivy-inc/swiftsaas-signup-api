var   AWS           = require('aws-sdk');
const db            = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'us-east-1'});

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

exports.registrationHandler = async(event)=>{
     var event_data          = JSON.stringify(event);
     var get_shortname         = JSON.parse(event.body);
     var short_name            = get_shortname.short_name;

     /**Topic Arns */
     const registration_topic       = process.env.Registration_Topic;
     const userpool_creation_topic  = process.env.Userpool_creation_Topic;
     const table_name               = process.env.Table_Name;

     /**Topic Arns ends */

    const params1 = {
		Key: {
			short_name: short_name
		},
		TableName: table_name
	};

    try{
        var check_workspace = await db.get(params1).promise();
    }catch(err){
        console.log(err);
    }

    if(Object.keys(check_workspace).length!=0){
        var  response1 = {'statuscode':400,'body':'shortname already existed.'};
        return Response(400,response1);
    
    }else if(Object.keys(check_workspace).length===0){
    
        var sns = new AWS.SNS({apiVersion: '2010-03-31'});

        var params = {  
            Message: event_data,
            Subject: "workspace creation input data",
            TopicArn: registration_topic
        };
    
        try{
            var publish_sns = await sns.publish(params).promise();
            console.log(publish_sns);
            
        }catch(err){
            console.log(err);
            return Response(400,"Something went wrong.");
        }

        var userpool_params = {
            Message: event_data,
            Subject: "userpool creation input data",
            TopicArn: userpool_creation_topic
        }

        try{
            var userpool_creation = await sns.publish(userpool_params).promise();
            console.log(userpool_creation);
        }catch(err1){
            console.log(err1);
            return Response(400,"Something went wrong.");
        }
        var response1 = {'statuscode':200,'body':'Account created. Please verify your email address using the link in the e-mail you received.'}
        return Response(200,response1);
    }      
};
const AWS       = require('aws-sdk');
const db        = new AWS.DynamoDB();
const moment      = require("moment-timezone");
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

exports.tenantadminsubscription = async(event) =>{
    var   input_data            = JSON.parse(event.body);
    var   plan_type             = input_data.plan;
    var   accountid             = input_data.accountid;
    const table_name            = process.env.Table_Name;  
    
    const date = new Date();
    const current_date = moment(date.getTime()).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm:ss");
    const expires_date = moment(date.getTime()).tz("Asia/Kolkata").add(5,'minute').format("YYYY-MM-DDTHH:mm:ss");

    var plan_dbparams = {
        TableName: table_name,
        Key:{
            'short_name' :{S:accountid}
        },
        ExpressionAttributeNames: {
            "#sp" : "subscribed_plan",
            "#sd" : "subscription_date",
            "#se" : "subscription_expires",
            "#st" : "status"
        }, 
        ExpressionAttributeValues: {
            ":pt": {
              S: plan_type
             },
             ":cd":{
              S: current_date
             },
             ":ed":{
              S: expires_date
             },
             ":ss":{
              S: 'active'   
             }
        },
        UpdateExpression: "SET #sp = :pt, #sd = :cd, #se = :ed, #st = :ss"
    };
    
    try{
        var tenant_plan = await db.updateItem(plan_dbparams).promise();
        console.log(tenant_plan);
        var response1 = {'statuscode':200,'body':'Plan subscribed successfully.'}
        return Response(200,response1);
    }catch(err){
        console.log(err);
        var response2 = {'statuscode':400,'body':err};
        return Response(400,response2);
    }

};
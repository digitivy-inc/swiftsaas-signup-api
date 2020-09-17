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



exports.subscriptionvalidate = async(event) =>{

    const table_name            = process.env.Table_Name;  
    var date                    = new Date();
    var current_date            = moment(date.getTime()).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm:ss");
    var array_iteams;
    var params = {
        ExpressionAttributeNames: {
         "#se": "subscription_expires",
         "#st": "status"
        }, 
        ExpressionAttributeValues: {
         ":ct": {
           S: current_date
          },
          ":cs":{
           S: 'active'  
          }
        }, 
        FilterExpression: "#se <= :ct AND #st = :cs", 
        TableName: table_name
       };

    try{
        var list_of_subscribers = await db.scan(params).promise();
        array_iteams=list_of_subscribers.Items;
    }catch(err){
        console.log(err);
    };

    for(var i=0;i<array_iteams.length;i++){
        var params1 = {
          TableName : table_name,
          Key:{
              'short_name' : array_iteams[i].short_name
          },
          ExpressionAttributeNames: {
              "#st" : "status"
          },
          ExpressionAttributeValues: {
              ":sc" : {
                  S : 'expired'
              }
          },
          UpdateExpression: "SET #st = :sc"
        };
        
        try{
            var update_status = await db.updateItem(params1).promise();
            console.log(update_status);
        }catch(err1){
            console.log(err1);
        } 
    }

};
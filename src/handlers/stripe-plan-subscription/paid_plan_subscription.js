const AWS           = require('aws-sdk');
const stripeapi     = require('stripe');
const stripekey     = require("../../secrets/stripekeys.json");
const stripe        = new stripeapi(stripekey.secretkey);
const db            = new AWS.DynamoDB();
const db1           = new AWS.DynamoDB.DocumentClient();


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

exports.paidplansubscription = async(event)=>{

    var   input_data   = JSON.parse(event.body);
    var   account_id   = input_data.shortname;
    var   price_id     = input_data.priceid;
    var   customer_id  = input_data.customerid;
    var   trial_period = input_data.trial_period;
    const table_name   = process.env.Table_Name;

    var params1 = {
      TableName:table_name,
      Key: {
			short_name: account_id
		  }
    }

    try{
      var check_item = await db1.get(params1).promise();
     
    }catch(err){
      console.log(err);
    }
    
    if((check_item.Item.status!=='active')&&(check_item.Item.status!=='expired')&&(check_item.Item.status===undefined)){
      try{
        var subscribe_free_plan = await stripe.subscriptions.create({
            customer: customer_id,
            items: [
              {
                price: price_id,
              },
            ],
            trial_period_days: trial_period
        });
        console.log(subscribe_free_plan);
        
    }catch(err){    
        console.log(err);
        return Response(400,err);
    }

    if(Object.keys(subscribe_free_plan).length!==0){

    var db_params = {
        TableName: table_name,
        Key:{
            'short_name' : {S:account_id}
          },
          ExpressionAttributeNames: {
            "#st"     : "status",
            "#cp"     : "current_plan",
            "#spi"    : "subscribed_product_id",
            "#si"     : "subscription_id",
            "#ts"     : "trial_start",
            "#te"     : "trial_end"
          },
          ExpressionAttributeValues: {
            ":stats"  : {
              S : 'active'
            },
            ":cplan":{
              S :subscribe_free_plan.status
            },
            ":spid" : {
              S : subscribe_free_plan.plan.product
            },
            ":sid":{
              S : subscribe_free_plan.id
            },
            ":tstart":{
              N : subscribe_free_plan.trial_start.toString()
            },
            ":tend":{
              N : subscribe_free_plan.trial_end.toString()
            }
          },
          UpdateExpression: "SET #st = :stats, #cp = :cplan ,#spi = :spid, #si = :sid, #ts = :tstart, #te = :tend"
        };
    
        try{
          var save_payment_dtls = await db.updateItem(db_params).promise();
          console.log(save_payment_dtls);
          var res1 = {'statuscode':200,'body':'Successfully subscribed.'};
          return Response(200,res1);
        }catch(err2){
          console.log(err2);
          var res2 = {'statuscode':400,'body':err2};
          return Response(400,res2);
        }
      }      
    }else if(check_item.Item.status==='active'){
        var res3 = {'statuscode':400,'body':'your plan is active state only.'};
        return Response(400,res3);
    }else if(check_item.Item.status==='expired'){
        var res4 = {'statuscode':400,'body':'your plan is expired.'};
        return Response(400,res4);
    }
};
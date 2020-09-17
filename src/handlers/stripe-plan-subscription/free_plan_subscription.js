const stripeapi = require('stripe');
const stripekey = require("../../secrets/stripekeys.json");
const stripe    = new stripeapi(stripekey.secretkey);

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

exports.plansubscription = async (event)=>{
    var input_data      = JSON.parse(event.body);
    const price_id      = input_data.priceid;
    const customer_id   = input_data.customer_id;

    try{
        const subscribe = await stripe.subscriptions.create({
            customer : customer_id,
            items: [{price : price_id}]
        }); 
        var res1 = {'statuscode':200,'body':subscribe};
        return Response(200,res1);
    }catch(err){
        var res2 = {'statuscode':400,'body':err};
        return Response(400,res2);
    }


};
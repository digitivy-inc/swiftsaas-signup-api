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

exports.stripeplanslist = async(event)=>{
    try{
        var list_of_plans = await stripe.plans.list();
        var res = {'statuscode':200,'body':list_of_plans};
        return Response(200,res);
    }catch(err){
        var res1 = {'statuscode':400,'body':err};
        return Response(400,res1);
    }
};
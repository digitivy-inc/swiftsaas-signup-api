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

exports.createplans = async(event) =>{

    var input_data       = JSON.parse(event.body);
    var plan_name        = input_data.planname;
    var plan_amount      = input_data.plan_price;
    var plan_currency    = input_data.plan_currency;
    var plan_interval    = input_data.plan_interval;
    

    try{
        const create_plan = await stripe.plans.create({
            amount: plan_amount,
            currency: plan_currency,
            interval: plan_interval,
            product: [{name : plan_name}],
          });

    }catch(err){
        console.log(err);
    }

};
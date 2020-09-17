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

exports.getcognitologinurl = async(event)=>{
    var short_name      = event.queryStringParameters.shortname; 
    const table_name    = process.env.Table_Name;

    var params1 = {
        Key: {
			short_name: short_name
		},
		TableName: table_name
    };

    try{
        var get_login_dtls = await db.get(params1).promise();
        if(Object.keys(get_login_dtls).length!=0){
            var loginurl = get_login_dtls.Item.login_url;
            var response1 = {'statuscode':200,'body':loginurl};
            return Response(200,response1);               
        }else if(Object.keys(get_login_dtls).length===0){
            var response = {'statuscode':400,'body':'shortname not existed.'};
            return Response(400,response);
        }
    }catch(err){
        console.log(err);
        return Response(400,err);
    }

};
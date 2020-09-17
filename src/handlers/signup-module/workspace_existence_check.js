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

exports.workspaceexistence = async(event)=>{

    var event_data          = JSON.stringify(event);
    var get_shortname       = JSON.parse(event.body);
    var short_name          = get_shortname.short_name;

    const table_name        = process.env.Table_Name;

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
        var response1 = {'statuscode':400,'body':'short name already existed, please choose other name.'};
        return Response(400,response1);
    }else if(Object.keys(check_workspace).length===0){
        var response1 = {'statuscode':200,'body':'short name is available.'};
        return Response(400,response1);
    }

};
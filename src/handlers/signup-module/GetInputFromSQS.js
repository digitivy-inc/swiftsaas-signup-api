//const databasemanager = require("../DatabaseManager/databasemanager");

const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'us-east-1'});

exports.getSQSInputHandler = async(event)=>{
    const message_from_sqs = JSON.parse(event.Records[0].body);
    const input_data       = JSON.parse(message_from_sqs.body);
    var short_name         = input_data.short_name;
    var org_name           = input_data.org_name;
    var owner              = input_data.owner;
    var firstname          = input_data.first_name;
    var lastname           = input_data.last_name;
    var phonenumber        = input_data.phonenumber;

    const table_name       = process.env.Table_Name;

    const params = {
        TableName: table_name,
        Item: {
            short_name,
            org_name,
            owner,
            firstname,
            lastname,
            phonenumber
        }
    };

    console.log(params);

    try {
       var output = await db.put(params).promise();
        console.log(output);
    } catch (err) {
        console.log(err);
    }

    return {};
};
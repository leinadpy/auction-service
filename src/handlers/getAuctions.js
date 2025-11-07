import AWS from "aws-sdk";
import createError from "http-errors";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import commonMiddleware from "../lib/commonMiddleware.js";
import { getAuctionsSchema } from "../lib/schemas/getAuctionsSchema.js";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  const { status } = event.queryStringParameters;

  if (!status) {
    throw new createError.BadRequest("Status query parameter is required");
  }

  let auctions;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "statusAndEndDate",
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": status,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();

    auctions = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions).use(
  validator({ eventSchema: transpileSchema(getAuctionsSchema) })
);

import AWS from "aws-sdk";
import commonMiddleware from "../lib/commonMiddleware.js";
import createError from "http-errors";
import { getAuctionById } from "./getAuction.js";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import { placeBidSchema } from "../lib/schemas/placeBidSchema.js";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if (auction.status !== "OPEN") {
    throw new createError.BadRequest(`You cannot bid on closed auctions`);
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.BadRequest(
      `Your bid must be higher than ${auction.highestBid.amount}`
    );
  }

  // Avoid double bidding
  if (email === auction.highestBid.bidder) {
    throw new createError.BadRequest(`You are already the highest bidder`);
  }

  // Bid identity validation
  if (email === auction.seller) {
    throw new createError.BadRequest(`You cannot bid on your own auction`);
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidder = :bidder",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email,
    },
    ReturnValues: "ALL_NEW",
  };

  let updatedAuction;
  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!updatedAuction) {
    throw new createError.NotFound(`Auction with ID "${id}" not found`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid).use(
  validator({ eventSchema: transpileSchema(placeBidSchema) })
);

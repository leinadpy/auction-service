import { getAuctionById } from "./getAuction.js";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3.js";
import validator from "@middy/validator";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";
import { updateAuctionImageUrl } from "../lib/updateAuctionImageUrl.js";
import { transpileSchema } from "@middy/validator/transpile";
import { uploadAuctionPictureSchema } from "../lib/schemas/uploadAuctionPictureSchema.js";

export async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);
  const { email } = event.requestContext.authorizer;

  // Validate auction ownership
  if (email !== auction.seller) {
    throw new createError.Forbidden(`You are not the seller for this auction`);
  }

  const base64String = event.body.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64String, "base64");

  // Validate the body contains image data
  if (buffer.toString("base64") !== base64String) {
    throw new createError.BadRequest(
      "An invalid base64 string was provided for the auction image."
    );
  }

  let updatedAuction;

  try {
    const pictureUrl = await uploadPictureToS3(`${auction.id}.jpg`, buffer);
    updatedAuction = await updateAuctionImageUrl(auction.id, pictureUrl);
  } catch (error) {
    console.error("Error uploading picture to S3:", error);
    throw new createError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(validator({ eventSchema: transpileSchema(uploadAuctionPictureSchema) }));

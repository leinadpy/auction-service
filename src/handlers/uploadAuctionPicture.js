import { getAuctionById } from "./getAuction.js";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3.js";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";
import { updateAuctionImageUrl } from "../lib/updateAuctionImageUrl.js";

export async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  try {
    const pictureUrl = await uploadPictureToS3(
      `${auction.id}.jpg`,
      buffer
    );
    console.log("Upload to S3 result:", pictureUrl);
    const updatedAuction = await updateAuctionImageUrl(auction.id, pictureUrl);
    console.log("Updated auction with picture URL:", updatedAuction);
  } catch (error) {
    console.error("Error uploading picture to S3:", error);
    throw new createError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
}

export const handler = middy(uploadAuctionPicture).use(httpErrorHandler());

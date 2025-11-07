import createError from "http-errors";
import { getEndedAuctions } from "../lib/getEndedAuctions.js";
import { closeAuction } from "../lib/closeAuction.js";

async function processAuctions(event, context) {
  try {
    const auctionsToClose = await getEndedAuctions();
    const closeAuctionPromises = auctionsToClose.map(closeAuction);
    await Promise.all(closeAuctionPromises);
    return { closed: closeAuctionPromises.length };
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
}

export const handler = processAuctions;

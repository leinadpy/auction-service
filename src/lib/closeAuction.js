import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(auction) {
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id: auction.id },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: {
            "#status": "status",
        },
        ExpressionAttributeValues: {
            ":status": "CLOSED",
        },
        ReturnValues: "ALL_NEW",
    };

    const result = await dynamodb.update(params).promise();

    const { title, seller, highestBid } = auction;
    const { amount, bidder } = highestBid;

    const notifySeller = sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: "Your auction has closed",
            recipient: seller,
            body: `Your auction for "${title}" has closed. ${
                amount > 0
                    ? `The winning bid was $${amount} by ${bidder}.`
                    : "No bids were placed on your auction."
            }`,
        }),
    }).promise();

    const notifyBidder = amount > 0 ? sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: "You won an auction!",
            recipient: bidder,
            body: `Congratulations! You won the auction for "${title}" with a bid of $${amount}.`,
        }),
    }).promise() : Promise.resolve();

    return Promise.all([notifySeller, notifyBidder]);
}
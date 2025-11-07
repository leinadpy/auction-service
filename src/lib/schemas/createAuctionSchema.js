export const createAuctionSchema = {
    type: "object",
    properties: {
        body: {
            type: "object",
            properties: {
                title: { type: "string", minLength: 1 },
            },
            required: ["title"],
            additionalProperties: false,
        },
    },
    required: ["body"],
};
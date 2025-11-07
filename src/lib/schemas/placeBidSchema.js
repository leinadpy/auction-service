export const placeBidSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        amount: { type: "number", minimum: 1 },
      },
      required: ["amount"],
      additionalProperties: false,
    },
  },
  required: ["body"],
};
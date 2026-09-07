export const wasUpdated = (object: object & { createdAt: Date; updatedAt: Date }) =>
  object.createdAt.toISOString() !== object.updatedAt.toISOString()

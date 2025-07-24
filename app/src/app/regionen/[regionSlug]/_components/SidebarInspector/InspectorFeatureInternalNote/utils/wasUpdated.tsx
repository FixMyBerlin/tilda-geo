export const wasUpdated = (object: Object & { createdAt: Date; updatedAt: Date }) =>
  object.createdAt.toISOString() !== object.updatedAt.toISOString()

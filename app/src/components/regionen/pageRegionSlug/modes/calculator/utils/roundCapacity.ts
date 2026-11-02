/**
 * A feature counts with the share that lies inside an area, so a sum of parking spaces is
 * fractional. There are no partial parking spaces: the sum is rounded down, and only a sum that
 * is at most 0.1 below the next number is that number. The capacity of one feature is rounded
 * the same way below 10 (`tilda_round_capacity`).
 */
export const roundCapacity = (sum: number) => Math.floor(sum + 0.1)

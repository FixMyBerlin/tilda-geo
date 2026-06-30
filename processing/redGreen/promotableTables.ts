const PROMOTION_TABLE_DENYLIST = new Set([
	"User",
	"Account",
	"Session",
	"Verification",
	"Region",
	"Membership",
	"Upload",
	"Note",
	"QaConfig",
	"Processing",
]);

const PROMOTION_TABLE_DENY_PATTERNS = [/^prisma_/i];

export function assertPromotableTable(table: string) {
	if (PROMOTION_TABLE_DENYLIST.has(table)) {
		throw new Error(
			`Promotion blocked: public.${table} is on the denylist (app/user data must not be promoted).`,
		);
	}
	for (const pattern of PROMOTION_TABLE_DENY_PATTERNS) {
		if (pattern.test(table)) {
			throw new Error(
				`Promotion blocked: public.${table} matches denylist pattern ${pattern}.`,
			);
		}
	}
}

export function assertPromotableTables(tables: string[]) {
	for (const table of tables) {
		assertPromotableTable(table);
	}
}

export function isIntermediateTable(table: string) {
	return table.startsWith("_");
}

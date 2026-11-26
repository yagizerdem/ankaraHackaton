import type { Query } from "mongoose";

const RESERVED_PARAMS = ["limit", "skip", "select"];
const FILTER_OPERATORS = ["gt", "gte", "lt", "lte", "ne", "in", "nin"];
const MAX_LIMIT = 100;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = Query<any, any>;

/**
 * Chainable helper that applies URL query params to a mongoose query.
 *
 *   /api/items?price[gte]=10&status=open&select=name,price&skip=20&limit=10
 *
 *   const items = await new ApiFeatures(Item.find(), params)
 *     .filter().select().skip().limit().query;
 */
export class ApiFeatures {
  constructor(
    public query: AnyQuery,
    private readonly queryParams: Record<string, string>,
  ) {}

  /** Equality filters plus `field[op]=value` with op in gt/gte/lt/lte/ne/in/nin. */
  filter() {
    const conditions: Record<string, Record<string, unknown> | string> = {};

    for (const [key, value] of Object.entries(this.queryParams)) {
      if (RESERVED_PARAMS.includes(key)) continue;

      const match = /^([^[\]$]+)(?:\[(\w+)\])?$/.exec(key);
      if (!match) continue; // rejects `$where`, `a[$ne]`-style operator injection

      const [, field, operator] = match;
      if (!operator) {
        conditions[field] = value;
        continue;
      }
      if (!FILTER_OPERATORS.includes(operator)) continue;

      const parsed = operator === "in" || operator === "nin" ? value.split(",") : value;
      const existing = conditions[field];
      conditions[field] = {
        ...(typeof existing === "object" ? existing : {}),
        [`$${operator}`]: parsed,
      };
    }

    this.query = this.query.find(conditions);
    return this;
  }

  /** `select=name,price,-secret` -> only those fields (`-` excludes). */
  select() {
    const { select } = this.queryParams;
    if (select) {
      // `+field` would re-enable schema-level `select: false` fields
      const fields = select
        .split(",")
        .map((field) => field.trim().replace(/^\+/, ""))
        .filter(Boolean);
      if (fields.length) this.query = this.query.select(fields.join(" "));
    }
    return this;
  }

  /** `skip=N` documents to skip. */
  skip() {
    const skip = Number.parseInt(this.queryParams.skip, 10);
    if (skip > 0) this.query = this.query.skip(skip);
    return this;
  }

  /** `limit=N`, capped at MAX_LIMIT; defaults to MAX_LIMIT when absent or invalid. */
  limit() {
    const limit = Number.parseInt(this.queryParams.limit, 10);
    this.query = this.query.limit(limit > 0 ? Math.min(limit, MAX_LIMIT) : MAX_LIMIT);
    return this;
  }
}

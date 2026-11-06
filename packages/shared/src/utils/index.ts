export function paginate<T>(items: T[], page: number, limit: number): { data: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

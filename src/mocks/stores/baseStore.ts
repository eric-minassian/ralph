/**
 * Base in-memory store for MSW handlers.
 * Provides CRUD operations with realistic validation (duplicates, not-found).
 */

export class StoreError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'StoreError'
    this.code = code
  }
}

export class BaseStore<T> {
  private items: Map<string, T> = new Map()
  private readonly getKey: (item: T) => string

  constructor(getKey: (item: T) => string) {
    this.getKey = getKey
  }

  create(item: T): T {
    const key = this.getKey(item)
    if (this.items.has(key)) {
      throw new StoreError(
        'ResourceExistsException',
        `Item with key '${key}' already exists`,
      )
    }
    this.items.set(key, item)
    return item
  }

  get(key: string): T {
    const item = this.items.get(key)
    if (item === undefined) {
      throw new StoreError(
        'ResourceNotFoundException',
        `Item with key '${key}' not found`,
      )
    }
    return item
  }

  list(): T[] {
    return [...this.items.values()]
  }

  listPaginated(
    maxResults: number,
    nextToken?: string,
  ): { items: T[]; nextToken: string | undefined } {
    const allItems = this.list()
    const startIndex = nextToken ? parseInt(nextToken, 10) : 0
    const endIndex = startIndex + maxResults
    const pageItems = allItems.slice(startIndex, endIndex)
    const newNextToken = endIndex < allItems.length ? String(endIndex) : undefined
    return { items: pageItems, nextToken: newNextToken }
  }

  update(key: string, updater: (item: T) => T): T {
    const existing = this.get(key)
    const updated = updater(existing)
    this.items.set(key, updated)
    return updated
  }

  delete(key: string): void {
    if (!this.items.has(key)) {
      throw new StoreError(
        'ResourceNotFoundException',
        `Item with key '${key}' not found`,
      )
    }
    this.items.delete(key)
  }

  has(key: string): boolean {
    return this.items.has(key)
  }

  clear(): void {
    this.items.clear()
  }

  get size(): number {
    return this.items.size
  }
}

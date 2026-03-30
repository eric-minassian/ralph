import { describe, it, expect, beforeEach } from 'vitest'
import { BaseStore, StoreError } from './baseStore'

interface TestItem {
  id: string
  name: string
  value: number
}

describe('BaseStore', () => {
  let store: BaseStore<TestItem>

  beforeEach(() => {
    store = new BaseStore<TestItem>((item) => item.id)
  })

  describe('create', () => {
    it('adds an item to the store', () => {
      const item: TestItem = { id: '1', name: 'test', value: 42 }
      const result = store.create(item)
      expect(result).toEqual(item)
      expect(store.size).toBe(1)
    })

    it('throws on duplicate key', () => {
      store.create({ id: '1', name: 'test', value: 42 })
      expect(() => {
        store.create({ id: '1', name: 'duplicate', value: 0 })
      }).toThrow(StoreError)
    })

    it('throws with ResourceExistsException code on duplicate', () => {
      store.create({ id: '1', name: 'test', value: 42 })
      try {
        store.create({ id: '1', name: 'duplicate', value: 0 })
        expect.unreachable('should have thrown')
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(StoreError)
        expect((error instanceof StoreError) && error.code).toBe(
          'ResourceExistsException',
        )
      }
    })
  })

  describe('get', () => {
    it('returns an existing item', () => {
      const item: TestItem = { id: '1', name: 'test', value: 42 }
      store.create(item)
      expect(store.get('1')).toEqual(item)
    })

    it('throws on missing key', () => {
      expect(() => {
        store.get('missing')
      }).toThrow(StoreError)
    })

    it('throws with ResourceNotFoundException code on missing', () => {
      try {
        store.get('missing')
        expect.unreachable('should have thrown')
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(StoreError)
        expect((error instanceof StoreError) && error.code).toBe(
          'ResourceNotFoundException',
        )
      }
    })
  })

  describe('list', () => {
    it('returns all items', () => {
      store.create({ id: '1', name: 'a', value: 1 })
      store.create({ id: '2', name: 'b', value: 2 })
      expect(store.list()).toHaveLength(2)
    })

    it('returns empty array when store is empty', () => {
      expect(store.list()).toEqual([])
    })
  })

  describe('listPaginated', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        store.create({ id: String(i), name: `item-${String(i)}`, value: i })
      }
    })

    it('returns first page with nextToken', () => {
      const result = store.listPaginated(2)
      expect(result.items).toHaveLength(2)
      expect(result.nextToken).toBe('2')
    })

    it('returns second page using nextToken', () => {
      const result = store.listPaginated(2, '2')
      expect(result.items).toHaveLength(2)
      expect(result.nextToken).toBe('4')
    })

    it('returns last page without nextToken', () => {
      const result = store.listPaginated(2, '4')
      expect(result.items).toHaveLength(1)
      expect(result.nextToken).toBeUndefined()
    })

    it('returns all items when maxResults exceeds total', () => {
      const result = store.listPaginated(100)
      expect(result.items).toHaveLength(5)
      expect(result.nextToken).toBeUndefined()
    })
  })

  describe('update', () => {
    it('updates an existing item', () => {
      store.create({ id: '1', name: 'original', value: 1 })
      const updated = store.update('1', (item) => ({
        ...item,
        name: 'updated',
      }))
      expect(updated.name).toBe('updated')
      expect(store.get('1').name).toBe('updated')
    })

    it('throws on missing key', () => {
      expect(() => {
        store.update('missing', (item) => item)
      }).toThrow(StoreError)
    })
  })

  describe('delete', () => {
    it('removes an existing item', () => {
      store.create({ id: '1', name: 'test', value: 1 })
      store.delete('1')
      expect(store.size).toBe(0)
    })

    it('throws on missing key', () => {
      expect(() => {
        store.delete('missing')
      }).toThrow(StoreError)
    })
  })

  describe('has', () => {
    it('returns true for existing key', () => {
      store.create({ id: '1', name: 'test', value: 1 })
      expect(store.has('1')).toBe(true)
    })

    it('returns false for missing key', () => {
      expect(store.has('missing')).toBe(false)
    })
  })

  describe('clear', () => {
    it('removes all items', () => {
      store.create({ id: '1', name: 'a', value: 1 })
      store.create({ id: '2', name: 'b', value: 2 })
      store.clear()
      expect(store.size).toBe(0)
      expect(store.list()).toEqual([])
    })
  })
})

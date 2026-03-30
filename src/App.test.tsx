import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from './test-utils'

describe('App smoke test', () => {
  it('renders with all providers without crashing', () => {
    renderWithProviders(<div data-testid="smoke">Hello</div>)
    expect(screen.getByTestId('smoke')).toHaveTextContent('Hello')
  })

  it('createTestQueryClient has no retries', () => {
    const { queryClient } = renderWithProviders(<div>test</div>)
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false)
  })
})

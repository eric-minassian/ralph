import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils'
import { TopNav } from './TopNav'

describe('TopNav', () => {
  it('renders the app title', () => {
    renderWithProviders(<TopNav />)

    expect(screen.getAllByText('Cognito Manager').length).toBeGreaterThan(0)
  })

  it('renders the user menu trigger', () => {
    renderWithProviders(<TopNav />)

    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0)
  })
})

import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../test-utils'
import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders home breadcrumb on root route', async () => {
    await renderWithRouter(Breadcrumbs)

    expect(screen.getAllByText('Home').length).toBeGreaterThan(0)
  })
})

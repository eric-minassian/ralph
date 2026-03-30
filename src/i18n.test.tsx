import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { renderWithProviders } from './test-utils'

function TranslationConsumer({ ns, tKey }: { ns?: string; tKey: string }) {
  const { t } = useTranslation(ns)
  return <span data-testid="translated">{t(tKey)}</span>
}

describe('i18n', () => {
  it('useTranslation() returns translated values', () => {
    renderWithProviders(<TranslationConsumer tKey="appName" />)
    expect(screen.getByTestId('translated')).toHaveTextContent('Cognito Manager')
  })

  it('namespaced keys work with namespace prefix', () => {
    renderWithProviders(<TranslationConsumer tKey="common:appName" />)
    expect(screen.getByTestId('translated')).toHaveTextContent('Cognito Manager')
  })

  it('missing keys fall back to the key itself', () => {
    renderWithProviders(<TranslationConsumer tKey="nonExistent.key" />)
    expect(screen.getByTestId('translated')).toHaveTextContent('nonExistent.key')
  })

  it('renders with all providers without crashing', () => {
    renderWithProviders(<div data-testid="smoke">Hello</div>)
    expect(screen.getByTestId('smoke')).toHaveTextContent('Hello')
  })

  it('createTestQueryClient has no retries', () => {
    const { queryClient } = renderWithProviders(<div>test</div>)
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false)
  })
})

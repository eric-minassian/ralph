import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from './locales/en/common.json'
import navigation from './locales/en/navigation.json'
import errors from './locales/en/errors.json'

// Initialize i18n for tests with real translation files
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'navigation', 'errors'],
  defaultNS: 'common',
  resources: {
    en: {
      common,
      navigation,
      errors,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

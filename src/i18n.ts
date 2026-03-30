import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// English translation resources
import common from './locales/en/common.json'
import navigation from './locales/en/navigation.json'
import errors from './locales/en/errors.json'
import validation from './locales/en/validation.json'
import userPools from './locales/en/userPools.json'
import users from './locales/en/users.json'
import groups from './locales/en/groups.json'
import appClients from './locales/en/appClients.json'
import identityProviders from './locales/en/identityProviders.json'
import domains from './locales/en/domains.json'
import resourceServers from './locales/en/resourceServers.json'
import importNs from './locales/en/import.json'
import security from './locales/en/security.json'
import branding from './locales/en/branding.json'
import devices from './locales/en/devices.json'
import webauthn from './locales/en/webauthn.json'
import mfa from './locales/en/mfa.json'
import tags from './locales/en/tags.json'
import terms from './locales/en/terms.json'

const LANGUAGE_STORAGE_KEY = 'cognito-manager-language'

function getStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'en'
  } catch {
    return 'en'
  }
}

export const supportedNamespaces = [
  'common',
  'navigation',
  'errors',
  'validation',
  'userPools',
  'users',
  'groups',
  'appClients',
  'identityProviders',
  'domains',
  'resourceServers',
  'import',
  'security',
  'branding',
  'devices',
  'webauthn',
  'mfa',
  'tags',
  'terms',
] as const

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common,
      navigation,
      errors,
      validation,
      userPools,
      users,
      groups,
      appClients,
      identityProviders,
      domains,
      resourceServers,
      import: importNs,
      security,
      branding,
      devices,
      webauthn,
      mfa,
      tags,
      terms,
    },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  ns: [...supportedNamespaces],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

// Persist language selection to localStorage
i18n.on('languageChanged', (lng: string) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  } catch {
    // localStorage may not be available
  }
})

export default i18n

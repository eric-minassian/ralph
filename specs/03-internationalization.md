# Spec: Internationalization (i18n)

## Overview

All user-facing strings must be externalized using react-i18next. No hardcoded strings anywhere in components. Translation files organized by feature domain. Default language is English.

## User Stories

- As a user, I want the application to display in my preferred language.
- As a developer, I want a clear convention for adding translatable strings so nothing gets hardcoded.

## Acceptance Criteria

- [ ] react-i18next configured with i18next backend
- [ ] Translation files in `src/locales/{lang}/{namespace}.json` format
- [ ] Namespaces match feature domains: `common`, `navigation`, `userPools`, `users`, `groups`, `appClients`, `identityProviders`, `domains`, `resourceServers`, `import`, `security`, `branding`, `devices`, `webauthn`, `mfa`, `tags`, `terms`, `errors`, `validation`
- [ ] `useTranslation()` hook used in all components — never raw strings
- [ ] Cloudscape component labels (e.g., table column headers, button text, form labels) all use i18n keys
- [ ] Date and number formatting uses i18next format functions (locale-aware)
- [ ] Error messages from API responses are mapped to i18n keys where possible
- [ ] Fallback to English when a translation key is missing
- [ ] Language selector in top navigation user menu
- [ ] Selected language persisted to localStorage
- [ ] ESLint rule or convention: no string literals in JSX (enforced via `react/jsx-no-literals` or equivalent)
- [ ] Unit tests: components render correct translations
- [ ] Unit tests: language switching works
- [ ] All Cloudscape component `ariaLabel`, `ariaDescription` props use i18n keys for accessibility

## Technical Constraints

- Translation keys must be namespaced: `t('users:createUser.title')` not `t('createUserTitle')`
- Only English translations required initially, but structure must support adding languages
- Pluralization must use i18next plural syntax (`_one`, `_other` suffixes)
- No string concatenation for translated strings — use interpolation: `t('greeting', { name })`
- Cloudscape's built-in i18n provider must be configured for component-level translations

## Out of Scope

- Translations for non-English languages (structure only, English content)
- RTL layout support

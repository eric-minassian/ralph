# Spec: API Client and Mocking

## Overview

Centralized API client using AWS SDK v3 (`@aws-sdk/client-cognito-identity-provider`) wrapped in TanStack Query hooks. MSW intercepts all SDK HTTP requests during development, enabling full offline development. Removing MSW requires zero component changes.

## User Stories

- As a developer, I want to develop the entire frontend without a real AWS account.
- As a developer, I want to switch from mocked to real APIs by changing one environment variable.
- As a developer, I want type-safe API hooks that match the Cognito API exactly.

## Acceptance Criteria

- [ ] `@aws-sdk/client-cognito-identity-provider` installed and configured
- [ ] Single `CognitoIdentityProviderClient` instance created in `src/api/client.ts`
- [ ] Client reads region and credentials from environment variables (`VITE_AWS_REGION`, etc.)
- [ ] TanStack Query hooks in `src/api/hooks/` — one file per API domain:
  - `useUserPools.ts` — queries and mutations for user pool operations
  - `useUsers.ts` — queries and mutations for user operations
  - `useGroups.ts` — queries and mutations for group operations
  - `useAppClients.ts` — queries and mutations for app client operations
  - `useIdentityProviders.ts` — queries and mutations for IdP operations
  - `useDomains.ts` — queries and mutations for domain operations
  - `useResourceServers.ts` — queries and mutations for resource server operations
  - `useUserImport.ts` — queries and mutations for import operations
  - `useSecurity.ts` — queries and mutations for risk config / auth events
  - `useBranding.ts` — queries and mutations for branding operations
  - `useDevices.ts` — queries and mutations for device operations
  - `useWebAuthn.ts` — queries and mutations for WebAuthn operations
  - `useMfa.ts` — queries and mutations for MFA operations
  - `useTags.ts` — queries and mutations for tagging operations
  - `useTerms.ts` — queries and mutations for terms operations
- [ ] Each hook file exports query hooks (`useListUserPools`, `useDescribeUserPool`, etc.) and mutation hooks (`useCreateUserPool`, `useDeleteUserPool`, etc.)
- [ ] Query keys are structured and consistent: `['cognito', domain, operation, ...params]`
- [ ] Mutations automatically invalidate related queries on success
- [ ] Error handling: mutations surface errors via TanStack Query's `error` state, typed as `CognitoIdentityProviderServiceException`
- [ ] MSW handlers in `src/mocks/handlers/` — one file per API domain
- [ ] MSW handlers intercept AWS SDK HTTP requests (POST to Cognito endpoint with `X-Amz-Target` header)
- [ ] MSW handlers maintain in-memory state (e.g., a mock user pool store) for realistic CRUD behavior
- [ ] Mock data factories in `src/mocks/factories/` for generating realistic test data
- [ ] Toggling `VITE_ENABLE_MOCKS=false` disables MSW — app hits real AWS APIs with zero code changes
- [ ] Unit tests for each hook file using MSW handlers
- [ ] All API types imported from `@aws-sdk/client-cognito-identity-provider` — never manually defined

## Technical Constraints

- Hooks must use the AWS SDK Command pattern: `client.send(new ListUserPoolsCommand({...}))`
- Never call `fetch()` or `axios` directly — always go through the SDK client
- MSW intercepts at the network level — SDK thinks it's talking to real AWS
- Query keys must be defined in a central `src/api/queryKeys.ts` for consistency
- Pagination must be handled using TanStack Query's `useInfiniteQuery` where the API supports `NextToken`
- All 122 API operations must have corresponding MSW handlers
- Mock stores must implement realistic validation (e.g., duplicate name errors, not-found errors)

## Out of Scope

- Real AWS credential management beyond environment variables
- AWS STS / temporary credential refresh

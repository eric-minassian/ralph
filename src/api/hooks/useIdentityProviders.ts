import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  CreateIdentityProviderCommand,
  DescribeIdentityProviderCommand,
  UpdateIdentityProviderCommand,
  DeleteIdentityProviderCommand,
  ListIdentityProvidersCommand,
  GetIdentityProviderByIdentifierCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  CreateIdentityProviderCommandInput,
  UpdateIdentityProviderCommandInput,
  DeleteIdentityProviderCommandInput,
  ListIdentityProvidersCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── List Identity Providers ─────────────────────────────────────────

export function useListIdentityProviders(input: ListIdentityProvidersCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.identityProviders.list(input.UserPoolId ?? ''), String(input.MaxResults ?? 60), input.NextToken ?? ''],
    queryFn: async () => {
      const command = new ListIdentityProvidersCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0,
  })
}

// ── Describe Identity Provider ──────────────────────────────────────

export function useDescribeIdentityProvider(userPoolId: string, providerName: string) {
  return useQuery({
    queryKey: queryKeys.identityProviders.detail(userPoolId, providerName),
    queryFn: async () => {
      const command = new DescribeIdentityProviderCommand({ UserPoolId: userPoolId, ProviderName: providerName })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && providerName.length > 0,
  })
}

// ── Get Identity Provider By Identifier ─────────────────────────────

export function useGetIdentityProviderByIdentifier(userPoolId: string, identifier: string) {
  return useQuery({
    queryKey: [...queryKeys.identityProviders.detail(userPoolId), 'byIdentifier', identifier],
    queryFn: async () => {
      const command = new GetIdentityProviderByIdentifierCommand({ UserPoolId: userPoolId, IdpIdentifier: identifier })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && identifier.length > 0,
  })
}

// ── Create Identity Provider ────────────────────────────────────────

export function useCreateIdentityProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateIdentityProviderCommandInput) => {
      const command = new CreateIdentityProviderCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.identityProviders.all })
    },
  })
}

// ── Update Identity Provider ────────────────────────────────────────

export function useUpdateIdentityProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateIdentityProviderCommandInput) => {
      const command = new UpdateIdentityProviderCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.identityProviders.all })
    },
  })
}

// ── Delete Identity Provider ────────────────────────────────────────

export function useDeleteIdentityProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeleteIdentityProviderCommandInput) => {
      const command = new DeleteIdentityProviderCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.identityProviders.all })
    },
  })
}

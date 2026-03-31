import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  CreateUserPoolDomainCommand,
  DescribeUserPoolDomainCommand,
  UpdateUserPoolDomainCommand,
  DeleteUserPoolDomainCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  CreateUserPoolDomainCommandInput,
  UpdateUserPoolDomainCommandInput,
  DeleteUserPoolDomainCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── Describe User Pool Domain ──────────────────────────────────────

export function useDescribeUserPoolDomain(domain: string) {
  return useQuery({
    queryKey: queryKeys.domains.detail(domain),
    queryFn: async () => {
      const command = new DescribeUserPoolDomainCommand({ Domain: domain })
      return cognitoClient.send(command)
    },
    enabled: domain.length > 0,
  })
}

// ── Describe Domain By User Pool (uses detail key with pool ID) ────

export function useDescribeDomainByUserPool(userPoolId: string, domainName: string | undefined) {
  return useQuery({
    queryKey: queryKeys.domains.detail(userPoolId, domainName ?? ''),
    queryFn: async () => {
      const command = new DescribeUserPoolDomainCommand({ Domain: domainName ?? '' })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && (domainName ?? '').length > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.DomainDescription?.Status
      // Auto-refresh while domain is in a transitional state
      if (status === 'CREATING' || status === 'UPDATING' || status === 'DELETING') {
        return 5000
      }
      return false
    },
  })
}

// ── Create User Pool Domain ────────────────────────────────────────

export function useCreateUserPoolDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateUserPoolDomainCommandInput) => {
      const command = new CreateUserPoolDomainCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    },
  })
}

// ── Update User Pool Domain ────────────────────────────────────────

export function useUpdateUserPoolDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateUserPoolDomainCommandInput) => {
      const command = new UpdateUserPoolDomainCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    },
  })
}

// ── Delete User Pool Domain ────────────────────────────────────────

export function useDeleteUserPoolDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeleteUserPoolDomainCommandInput) => {
      const command = new DeleteUserPoolDomainCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.domains.all })
    },
  })
}

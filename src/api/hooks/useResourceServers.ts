import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  CreateResourceServerCommand,
  DescribeResourceServerCommand,
  UpdateResourceServerCommand,
  DeleteResourceServerCommand,
  ListResourceServersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  CreateResourceServerCommandInput,
  UpdateResourceServerCommandInput,
  DeleteResourceServerCommandInput,
  ListResourceServersCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── List Resource Servers ───────────────────────────────────────────

export function useListResourceServers(input: ListResourceServersCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.resourceServers.list(input.UserPoolId ?? ''), String(input.MaxResults ?? 20), input.NextToken ?? ''],
    queryFn: async () => {
      const command = new ListResourceServersCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0,
  })
}

// ── Describe Resource Server ────────────────────────────────────────

export function useDescribeResourceServer(userPoolId: string, identifier: string) {
  return useQuery({
    queryKey: queryKeys.resourceServers.detail(userPoolId, identifier),
    queryFn: async () => {
      const command = new DescribeResourceServerCommand({ UserPoolId: userPoolId, Identifier: identifier })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && identifier.length > 0,
  })
}

// ── Create Resource Server ──────────────────────────────────────────

export function useCreateResourceServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateResourceServerCommandInput) => {
      const command = new CreateResourceServerCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resourceServers.all })
    },
  })
}

// ── Update Resource Server ──────────────────────────────────────────

export function useUpdateResourceServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateResourceServerCommandInput) => {
      const command = new UpdateResourceServerCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resourceServers.all })
    },
  })
}

// ── Delete Resource Server ──────────────────────────────────────────

export function useDeleteResourceServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeleteResourceServerCommandInput) => {
      const command = new DeleteResourceServerCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resourceServers.all })
    },
  })
}

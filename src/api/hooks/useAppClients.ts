import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  CreateUserPoolClientCommand,
  DescribeUserPoolClientCommand,
  UpdateUserPoolClientCommand,
  DeleteUserPoolClientCommand,
  ListUserPoolClientsCommand,
  AddUserPoolClientSecretCommand,
  DeleteUserPoolClientSecretCommand,
  ListUserPoolClientSecretsCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  CreateUserPoolClientCommandInput,
  UpdateUserPoolClientCommandInput,
  ListUserPoolClientsCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── List App Clients ────────────────────────────────────────────────

export function useListAppClients(input: ListUserPoolClientsCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.appClients.list(input.UserPoolId ?? ''), String(input.MaxResults ?? 60), input.NextToken ?? ''],
    queryFn: async () => {
      const command = new ListUserPoolClientsCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0,
  })
}

// ── Describe App Client ─────────────────────────────────────────────

export function useDescribeAppClient(userPoolId: string, clientId: string) {
  return useQuery({
    queryKey: queryKeys.appClients.detail(userPoolId, clientId),
    queryFn: async () => {
      const command = new DescribeUserPoolClientCommand({ UserPoolId: userPoolId, ClientId: clientId })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && clientId.length > 0,
  })
}

// ── Create App Client ───────────────────────────────────────────────

export function useCreateAppClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateUserPoolClientCommandInput) => {
      const command = new CreateUserPoolClientCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appClients.all })
    },
  })
}

// ── Update App Client ───────────────────────────────────────────────

export function useUpdateAppClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateUserPoolClientCommandInput) => {
      const command = new UpdateUserPoolClientCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appClients.all })
    },
  })
}

// ── Delete App Client ───────────────────────────────────────────────

export function useDeleteAppClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { UserPoolId: string; ClientId: string }) => {
      const command = new DeleteUserPoolClientCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appClients.all })
    },
  })
}

// ── Add Client Secret ───────────────────────────────────────────────

export function useAddAppClientSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { UserPoolId: string; ClientId: string }) => {
      const command = new AddUserPoolClientSecretCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appClients.all })
    },
  })
}

// ── Delete Client Secret ────────────────────────────────────────────

export function useDeleteAppClientSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { UserPoolId: string; ClientId: string; ClientSecretId: string }) => {
      const command = new DeleteUserPoolClientSecretCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appClients.all })
    },
  })
}

// ── List Client Secrets ─────────────────────────────────────────────

export function useListAppClientSecrets(userPoolId: string, clientId: string) {
  return useQuery({
    queryKey: [...queryKeys.appClients.detail(userPoolId, clientId), 'secrets'],
    queryFn: async () => {
      const command = new ListUserPoolClientSecretsCommand({ UserPoolId: userPoolId, ClientId: clientId })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && clientId.length > 0,
  })
}

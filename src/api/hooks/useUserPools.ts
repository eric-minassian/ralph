import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ListUserPoolsCommand,
  DescribeUserPoolCommand,
  CreateUserPoolCommand,
  UpdateUserPoolCommand,
  DeleteUserPoolCommand,
  AddCustomAttributesCommand,
  GetUserPoolMfaConfigCommand,
  SetUserPoolMfaConfigCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  ListUserPoolsCommandInput,
  CreateUserPoolCommandInput,
  UpdateUserPoolCommandInput,
  DeleteUserPoolCommandInput,
  AddCustomAttributesCommandInput,
  SetUserPoolMfaConfigCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── List ─────────────────────────────────────────────────────────────

export function useListUserPools(input: Omit<ListUserPoolsCommandInput, 'MaxResults'> & { MaxResults?: number } = {}) {
  const maxResults = input.MaxResults ?? 20
  return useQuery({
    queryKey: [...queryKeys.userPools.list(), String(maxResults), input.NextToken ?? ''],
    queryFn: async () => {
      const command = new ListUserPoolsCommand({ MaxResults: maxResults, NextToken: input.NextToken })
      return cognitoClient.send(command)
    },
  })
}

// ── Describe ─────────────────────────────────────────────────────────

export function useDescribeUserPool(userPoolId: string) {
  return useQuery({
    queryKey: queryKeys.userPools.detail(userPoolId),
    queryFn: async () => {
      const command = new DescribeUserPoolCommand({ UserPoolId: userPoolId })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0,
  })
}

// ── Create ───────────────────────────────────────────────────────────

export function useCreateUserPool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateUserPoolCommandInput) => {
      const command = new CreateUserPoolCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userPools.all })
    },
  })
}

// ── Update ───────────────────────────────────────────────────────────

export function useUpdateUserPool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateUserPoolCommandInput) => {
      const command = new UpdateUserPoolCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userPools.all })
    },
  })
}

// ── Delete ───────────────────────────────────────────────────────────

export function useDeleteUserPool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeleteUserPoolCommandInput) => {
      const command = new DeleteUserPoolCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userPools.all })
    },
  })
}

// ── Add Custom Attributes ────────────────────────────────────────────

export function useAddCustomAttributes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddCustomAttributesCommandInput) => {
      const command = new AddCustomAttributesCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userPools.all })
    },
  })
}

// ── Get MFA Config ───────────────────────────────────────────────────

export function useGetUserPoolMfaConfig(userPoolId: string) {
  return useQuery({
    queryKey: [...queryKeys.mfa.detail(userPoolId), 'pool'],
    queryFn: async () => {
      const command = new GetUserPoolMfaConfigCommand({ UserPoolId: userPoolId })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0,
  })
}

// ── Set MFA Config ───────────────────────────────────────────────────

export function useSetUserPoolMfaConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SetUserPoolMfaConfigCommandInput) => {
      const command = new SetUserPoolMfaConfigCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userPools.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.mfa.all })
    },
  })
}

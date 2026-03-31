import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  CreateGroupCommand,
  GetGroupCommand,
  UpdateGroupCommand,
  DeleteGroupCommand,
  ListGroupsCommand,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  CreateGroupCommandInput,
  UpdateGroupCommandInput,
  DeleteGroupCommandInput,
  ListGroupsCommandInput,
  ListUsersInGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── List Groups ─────────────────────────────────────────────────────

export function useListGroups(input: ListGroupsCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.groups.list(input.UserPoolId ?? ''), String(input.Limit ?? 60), input.NextToken ?? ''],
    queryFn: async () => {
      const command = new ListGroupsCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0,
  })
}

// ── Get Group ───────────────────────────────────────────────────────

export function useGetGroup(userPoolId: string, groupName: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(userPoolId, groupName),
    queryFn: async () => {
      const command = new GetGroupCommand({ UserPoolId: userPoolId, GroupName: groupName })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && groupName.length > 0,
  })
}

// ── Create Group ────────────────────────────────────────────────────

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateGroupCommandInput) => {
      const command = new CreateGroupCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

// ── Update Group ────────────────────────────────────────────────────

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateGroupCommandInput) => {
      const command = new UpdateGroupCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

// ── Delete Group ────────────────────────────────────────────────────

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeleteGroupCommandInput) => {
      const command = new DeleteGroupCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

// ── List Users In Group ─────────────────────────────────────────────

export function useListUsersInGroup(input: ListUsersInGroupCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.groups.detail(input.UserPoolId ?? '', input.GroupName ?? ''), 'users', String(input.Limit ?? 60), input.NextToken ?? ''],
    queryFn: async () => {
      const command = new ListUsersInGroupCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0 && (input.GroupName ?? '').length > 0,
  })
}

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminConfirmSignUpCommand,
  AdminResetUserPasswordCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserAttributesCommand,
  AdminUserGlobalSignOutCommand,
  AdminSetUserMFAPreferenceCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminGetDeviceCommand,
  AdminListDevicesCommand,
  AdminForgetDeviceCommand,
  AdminUpdateDeviceStatusCommand,
  AdminDisableProviderForUserCommand,
  AdminLinkProviderForUserCommand,
  AdminListUserAuthEventsCommand,
  AdminUpdateAuthEventFeedbackCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  AdminCreateUserCommandInput,
  AdminDeleteUserCommandInput,
  AdminEnableUserCommandInput,
  AdminDisableUserCommandInput,
  AdminConfirmSignUpCommandInput,
  AdminResetUserPasswordCommandInput,
  AdminSetUserPasswordCommandInput,
  AdminUpdateUserAttributesCommandInput,
  AdminDeleteUserAttributesCommandInput,
  AdminUserGlobalSignOutCommandInput,
  AdminSetUserMFAPreferenceCommandInput,
  AdminAddUserToGroupCommandInput,
  AdminRemoveUserFromGroupCommandInput,
  AdminListGroupsForUserCommandInput,
  AdminGetDeviceCommandInput,
  AdminListDevicesCommandInput,
  AdminForgetDeviceCommandInput,
  AdminUpdateDeviceStatusCommandInput,
  AdminDisableProviderForUserCommandInput,
  AdminLinkProviderForUserCommandInput,
  AdminListUserAuthEventsCommandInput,
  AdminUpdateAuthEventFeedbackCommandInput,
  AdminInitiateAuthCommandInput,
  AdminRespondToAuthChallengeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── List Users ──────────────────────────────────────────────────────

interface UseListUsersInput {
  UserPoolId: string
  Limit?: number
  PaginationToken?: string
  Filter?: string
}

export function useListUsers(input: UseListUsersInput) {
  const limit = input.Limit ?? 20
  return useQuery({
    queryKey: [...queryKeys.users.list(input.UserPoolId), String(limit), input.PaginationToken ?? '', input.Filter ?? ''],
    queryFn: async () => {
      const command = new ListUsersCommand({
        UserPoolId: input.UserPoolId,
        Limit: limit,
        PaginationToken: input.PaginationToken,
        Filter: input.Filter,
      })
      return cognitoClient.send(command)
    },
    enabled: input.UserPoolId.length > 0,
  })
}

// ── Admin Get User ──────────────────────────────────────────────────

export function useAdminGetUser(userPoolId: string, username: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userPoolId, username),
    queryFn: async () => {
      const command = new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && username.length > 0,
  })
}

// ── Admin Create User ───────────────────────────────────────────────

export function useAdminCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminCreateUserCommandInput) => {
      const command = new AdminCreateUserCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Delete User ───────────────────────────────────────────────

export function useAdminDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminDeleteUserCommandInput) => {
      const command = new AdminDeleteUserCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Enable User ───────────────────────────────────────────────

export function useAdminEnableUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminEnableUserCommandInput) => {
      const command = new AdminEnableUserCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Disable User ──────────────────────────────────────────────

export function useAdminDisableUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminDisableUserCommandInput) => {
      const command = new AdminDisableUserCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Confirm Sign Up ───────────────────────────────────────────

export function useAdminConfirmSignUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminConfirmSignUpCommandInput) => {
      const command = new AdminConfirmSignUpCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Reset User Password ───────────────────────────────────────

export function useAdminResetUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminResetUserPasswordCommandInput) => {
      const command = new AdminResetUserPasswordCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Set User Password ─────────────────────────────────────────

export function useAdminSetUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminSetUserPasswordCommandInput) => {
      const command = new AdminSetUserPasswordCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Update User Attributes ────────────────────────────────────

export function useAdminUpdateUserAttributes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminUpdateUserAttributesCommandInput) => {
      const command = new AdminUpdateUserAttributesCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Delete User Attributes ────────────────────────────────────

export function useAdminDeleteUserAttributes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminDeleteUserAttributesCommandInput) => {
      const command = new AdminDeleteUserAttributesCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin User Global Sign Out ──────────────────────────────────────

export function useAdminUserGlobalSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminUserGlobalSignOutCommandInput) => {
      const command = new AdminUserGlobalSignOutCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Set User MFA Preference ───────────────────────────────────

export function useAdminSetUserMFAPreference() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminSetUserMFAPreferenceCommandInput) => {
      const command = new AdminSetUserMFAPreferenceCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.mfa.all })
    },
  })
}

// ── Admin Add User To Group ─────────────────────────────────────────

export function useAdminAddUserToGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminAddUserToGroupCommandInput) => {
      const command = new AdminAddUserToGroupCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

// ── Admin Remove User From Group ────────────────────────────────────

export function useAdminRemoveUserFromGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminRemoveUserFromGroupCommandInput) => {
      const command = new AdminRemoveUserFromGroupCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

// ── Admin List Groups For User ──────────────────────────────────────

export function useAdminListGroupsForUser(input: AdminListGroupsForUserCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.users.detail(input.UserPoolId ?? '', input.Username ?? ''), 'groups'],
    queryFn: async () => {
      const command = new AdminListGroupsForUserCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0 && (input.Username ?? '').length > 0,
  })
}

// ── Admin Get Device ────────────────────────────────────────────────

export function useAdminGetDevice(input: AdminGetDeviceCommandInput) {
  return useQuery({
    queryKey: queryKeys.devices.detail(input.UserPoolId ?? '', input.Username ?? '', input.DeviceKey ?? ''),
    queryFn: async () => {
      const command = new AdminGetDeviceCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0 && (input.DeviceKey ?? '').length > 0,
  })
}

// ── Admin List Devices ──────────────────────────────────────────────

export function useAdminListDevices(input: AdminListDevicesCommandInput) {
  return useQuery({
    queryKey: queryKeys.devices.list(input.UserPoolId ?? '', input.Username ?? ''),
    queryFn: async () => {
      const command = new AdminListDevicesCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0 && (input.Username ?? '').length > 0,
  })
}

// ── Admin Forget Device ─────────────────────────────────────────────

export function useAdminForgetDevice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminForgetDeviceCommandInput) => {
      const command = new AdminForgetDeviceCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all })
    },
  })
}

// ── Admin Update Device Status ──────────────────────────────────────

export function useAdminUpdateDeviceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminUpdateDeviceStatusCommandInput) => {
      const command = new AdminUpdateDeviceStatusCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all })
    },
  })
}

// ── Admin Disable Provider For User ─────────────────────────────────

export function useAdminDisableProviderForUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminDisableProviderForUserCommandInput) => {
      const command = new AdminDisableProviderForUserCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin Link Provider For User ────────────────────────────────────

export function useAdminLinkProviderForUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminLinkProviderForUserCommandInput) => {
      const command = new AdminLinkProviderForUserCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

// ── Admin List User Auth Events ─────────────────────────────────────

export function useAdminListUserAuthEvents(input: AdminListUserAuthEventsCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.security.list(input.UserPoolId ?? '', input.Username ?? ''), 'authEvents'],
    queryFn: async () => {
      const command = new AdminListUserAuthEventsCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0 && (input.Username ?? '').length > 0,
  })
}

// ── Admin Update Auth Event Feedback ────────────────────────────────

export function useAdminUpdateAuthEventFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AdminUpdateAuthEventFeedbackCommandInput) => {
      const command = new AdminUpdateAuthEventFeedbackCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.security.all })
    },
  })
}

// ── Admin Initiate Auth ─────────────────────────────────────────────

export function useAdminInitiateAuth() {
  return useMutation({
    mutationFn: async (input: AdminInitiateAuthCommandInput) => {
      const command = new AdminInitiateAuthCommand(input)
      return cognitoClient.send(command)
    },
  })
}

// ── Admin Respond To Auth Challenge ─────────────────────────────────

export function useAdminRespondToAuthChallenge() {
  return useMutation({
    mutationFn: async (input: AdminRespondToAuthChallengeCommandInput) => {
      const command = new AdminRespondToAuthChallengeCommand(input)
      return cognitoClient.send(command)
    },
  })
}

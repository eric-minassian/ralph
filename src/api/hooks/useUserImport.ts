import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  CreateUserImportJobCommand,
  DescribeUserImportJobCommand,
  StartUserImportJobCommand,
  StopUserImportJobCommand,
  ListUserImportJobsCommand,
  GetCSVHeaderCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type {
  CreateUserImportJobCommandInput,
  ListUserImportJobsCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'
import { cognitoClient } from '../client'
import { queryKeys } from '../queryKeys'

// ── List User Import Jobs ──────────────────────────────────────────

export function useListUserImportJobs(input: ListUserImportJobsCommandInput) {
  return useQuery({
    queryKey: [...queryKeys.userImport.list(input.UserPoolId ?? ''), String(input.MaxResults ?? 20), input.PaginationToken ?? ''],
    queryFn: async () => {
      const command = new ListUserImportJobsCommand(input)
      return cognitoClient.send(command)
    },
    enabled: (input.UserPoolId ?? '').length > 0,
    refetchInterval: 5000,
  })
}

// ── Describe User Import Job ───────────────────────────────────────

export function useDescribeUserImportJob(userPoolId: string, jobId: string) {
  return useQuery({
    queryKey: queryKeys.userImport.detail(userPoolId, jobId),
    queryFn: async () => {
      const command = new DescribeUserImportJobCommand({ UserPoolId: userPoolId, JobId: jobId })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0 && jobId.length > 0,
  })
}

// ── Create User Import Job ─────────────────────────────────────────

export function useCreateUserImportJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateUserImportJobCommandInput) => {
      const command = new CreateUserImportJobCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userImport.all })
    },
  })
}

// ── Start User Import Job ──────────────────────────────────────────

export function useStartUserImportJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { UserPoolId: string; JobId: string }) => {
      const command = new StartUserImportJobCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userImport.all })
    },
  })
}

// ── Stop User Import Job ───────────────────────────────────────────

export function useStopUserImportJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { UserPoolId: string; JobId: string }) => {
      const command = new StopUserImportJobCommand(input)
      return cognitoClient.send(command)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userImport.all })
    },
  })
}

// ── Get CSV Header ─────────────────────────────────────────────────

export function useGetCSVHeader(userPoolId: string) {
  return useQuery({
    queryKey: [...queryKeys.userImport.list(userPoolId), 'csvHeader'],
    queryFn: async () => {
      const command = new GetCSVHeaderCommand({ UserPoolId: userPoolId })
      return cognitoClient.send(command)
    },
    enabled: userPoolId.length > 0,
  })
}

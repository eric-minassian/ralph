import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../../test-utils'
import { importJobStore } from '../../../../mocks/stores/importJobStore'
import {
  useListUserImportJobs,
  useDescribeUserImportJob,
  useCreateUserImportJob,
  useStartUserImportJob,
  useGetCSVHeader,
} from '../../../../api/hooks/useUserImport'
import { useTranslation } from 'react-i18next'

const POOL_ID = 'us-east-1_TestPool'

function ImportJobListTestHarness() {
  const { t } = useTranslation('import')
  const { data, isLoading } = useListUserImportJobs({ UserPoolId: POOL_ID, MaxResults: 60 })

  if (isLoading) {
    return <div>{t('common:loading')}</div>
  }

  const jobs = data?.UserImportJobs ?? []

  return (
    <div>
      <h1>{t('list.title')}</h1>
      {jobs.length === 0 ? (
        <div>{t('list.emptyTitle')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('list.columns.jobName')}</th>
              <th>{t('list.columns.status')}</th>
              <th>{t('list.columns.importedUsers')}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.JobId}>
                <td>{job.JobName}</td>
                <td>{job.Status}</td>
                <td>{String(job.ImportedUsers ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

describe('ImportJobList integration', () => {
  beforeEach(() => {
    importJobStore.clear()
  })

  it('shows empty state when no jobs exist', async () => {
    renderWithProviders(<ImportJobListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('No import jobs')).toBeInTheDocument()
    })
  })

  it('renders import jobs from MSW', async () => {
    importJobStore.create(POOL_ID, {
      JobName: 'First Import',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })
    importJobStore.create(POOL_ID, {
      JobName: 'Second Import',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })

    renderWithProviders(<ImportJobListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('First Import')).toBeInTheDocument()
      expect(screen.getByText('Second Import')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderWithProviders(<ImportJobListTestHarness />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders correct column headers', async () => {
    importJobStore.create(POOL_ID, {
      JobName: 'Header Test',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })

    renderWithProviders(<ImportJobListTestHarness />)

    await waitFor(() => {
      expect(screen.getByText('Job name')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Imported')).toBeInTheDocument()
    })
  })
})

describe('useListUserImportJobs hook', () => {
  beforeEach(() => {
    importJobStore.clear()
  })

  function HookTestHarness({ maxResults }: { maxResults: number }) {
    const { data, isLoading, isError } = useListUserImportJobs({
      UserPoolId: POOL_ID,
      MaxResults: maxResults,
    })

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data && (
          <>
            <span data-testid="count">{data.UserImportJobs?.length ?? 0}</span>
            {data.PaginationToken !== undefined && (
              <span data-testid="next-token">{data.PaginationToken}</span>
            )}
          </>
        )}
      </div>
    )
  }

  it('fetches import jobs', async () => {
    importJobStore.create(POOL_ID, {
      JobName: 'A',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })
    importJobStore.create(POOL_ID, {
      JobName: 'B',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })

    renderWithProviders(<HookTestHarness maxResults={10} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
    })
  })

  it('handles pagination via MaxResults', async () => {
    for (let i = 0; i < 5; i++) {
      importJobStore.create(POOL_ID, {
        JobName: `Job ${String(i)}`,
        CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
      })
    }

    renderWithProviders(<HookTestHarness maxResults={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2')
      expect(screen.getByTestId('next-token')).toBeInTheDocument()
    })
  })
})

describe('useDescribeUserImportJob hook', () => {
  beforeEach(() => {
    importJobStore.clear()
  })

  function DetailHarness({ jobId }: { jobId: string }) {
    const { data, isLoading, isError } = useDescribeUserImportJob(POOL_ID, jobId)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {isError && <span data-testid="error">error</span>}
        {data?.UserImportJob && (
          <>
            <span data-testid="name">{data.UserImportJob.JobName}</span>
            <span data-testid="status">{data.UserImportJob.Status}</span>
          </>
        )}
      </div>
    )
  }

  it('fetches a specific import job', async () => {
    const created = importJobStore.create(POOL_ID, {
      JobName: 'Detail Test',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })

    renderWithProviders(<DetailHarness jobId={created.JobId ?? ''} />)

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Detail Test')
      expect(screen.getByTestId('status')).toHaveTextContent('Created')
    })
  })
})

describe('useCreateUserImportJob mutation', () => {
  beforeEach(() => {
    importJobStore.clear()
  })

  function CreateHarness() {
    const createJob = useCreateUserImportJob()

    return (
      <div>
        <button
          onClick={() => {
            createJob.mutate({
              UserPoolId: POOL_ID,
              JobName: 'New Import',
              CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
            })
          }}
        >
          Create
        </button>
        {createJob.isSuccess && <span data-testid="success">created</span>}
        {createJob.isError && <span data-testid="error">error</span>}
      </div>
    )
  }

  it('creates an import job via mutation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateHarness />)

    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const result = importJobStore.list(POOL_ID, 10)
    expect(result.UserImportJobs).toHaveLength(1)
    expect(result.UserImportJobs[0]?.JobName).toBe('New Import')
  })
})

describe('useStartUserImportJob mutation', () => {
  beforeEach(() => {
    importJobStore.clear()
  })

  function StartHarness({ jobId }: { jobId: string }) {
    const startJob = useStartUserImportJob()

    return (
      <div>
        <button
          onClick={() => {
            startJob.mutate({ UserPoolId: POOL_ID, JobId: jobId })
          }}
        >
          Start
        </button>
        {startJob.isSuccess && <span data-testid="success">started</span>}
        {startJob.isError && <span data-testid="error">error</span>}
      </div>
    )
  }

  it('starts an import job via mutation', async () => {
    const created = importJobStore.create(POOL_ID, {
      JobName: 'Start Test',
      CloudWatchLogsRoleArn: 'arn:aws:iam::123456789012:role/R',
    })

    const user = userEvent.setup()
    renderWithProviders(<StartHarness jobId={created.JobId ?? ''} />)

    await user.click(screen.getByText('Start'))

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument()
    })

    const job = importJobStore.describe(POOL_ID, created.JobId ?? '')
    expect(job.Status).toBe('Pending')
  })
})

describe('useGetCSVHeader hook', () => {
  function CSVHarness() {
    const { data, isLoading } = useGetCSVHeader(POOL_ID)

    return (
      <div>
        {isLoading && <span data-testid="loading">loading</span>}
        {data && (
          <>
            <span data-testid="header-count">{data.CSVHeader?.length ?? 0}</span>
            <span data-testid="pool-id">{data.UserPoolId}</span>
          </>
        )}
      </div>
    )
  }

  it('fetches CSV headers', async () => {
    renderWithProviders(<CSVHarness />)

    await waitFor(() => {
      expect(screen.getByTestId('pool-id')).toHaveTextContent(POOL_ID)
      expect(Number(screen.getByTestId('header-count').textContent)).toBeGreaterThan(0)
    })
  })
})

import { useState, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Wizard from '@cloudscape-design/components/wizard'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import FileUpload from '@cloudscape-design/components/file-upload'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import { useCreateUserImportJob, useGetCSVHeader } from '../../../../api/hooks/useUserImport'
import { useNotifications } from '../../../../hooks/useNotifications'

export const Route = createFileRoute('/user-pools/$userPoolId/import/create')({
  component: CreateImportJobPage,
})

interface FormState {
  jobName: string
  csvFile: File[]
  iamRoleArn: string
}

interface FormErrors {
  jobName: string
  csvFile: string
  iamRoleArn: string
}

const EMPTY_ERRORS: FormErrors = { jobName: '', csvFile: '', iamRoleArn: '' }

const IAM_ROLE_ARN_PATTERN = /^arn:aws:iam::\d{12}:role\/.+$/

function CreateImportJobPage() {
  const { t } = useTranslation('import')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const { addNotification } = useNotifications()
  const createJob = useCreateUserImportJob()
  const csvHeaderQuery = useGetCSVHeader(userPoolId)

  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [formState, setFormState] = useState<FormState>({
    jobName: '',
    csvFile: [],
    iamRoleArn: '',
  })
  const [errors, setErrors] = useState(EMPTY_ERRORS)

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const newErrors: FormErrors = { ...EMPTY_ERRORS }
      let hasError = false

      if (stepIndex === 0) {
        if (formState.jobName.trim().length === 0) {
          newErrors.jobName = t('create.validation.jobNameRequired')
          hasError = true
        } else if (formState.jobName.trim().length > 128) {
          newErrors.jobName = t('create.validation.jobNameTooLong')
          hasError = true
        }
      }

      if (stepIndex === 2) {
        if (formState.csvFile.length === 0) {
          newErrors.csvFile = t('create.validation.fileRequired')
          hasError = true
        }
      }

      if (stepIndex === 3) {
        if (formState.iamRoleArn.trim().length === 0) {
          newErrors.iamRoleArn = t('create.validation.iamRoleArnRequired')
          hasError = true
        } else if (!IAM_ROLE_ARN_PATTERN.test(formState.iamRoleArn.trim())) {
          newErrors.iamRoleArn = t('create.validation.iamRoleArnInvalid')
          hasError = true
        }
      }

      setErrors(newErrors)
      return !hasError
    },
    [formState, t],
  )

  const handleNavigate: React.ComponentProps<typeof Wizard>['onNavigate'] = ({
    detail,
  }) => {
    if (detail.requestedStepIndex > activeStepIndex) {
      if (!validateStep(activeStepIndex)) return
    }
    setErrors(EMPTY_ERRORS)
    setActiveStepIndex(detail.requestedStepIndex)
  }

  const handleDownloadTemplate = () => {
    const csvHeader = csvHeaderQuery.data?.CSVHeader
    if (!csvHeader) {
      addNotification({
        id: `csv-err-${String(Date.now())}`,
        type: 'error',
        content: t('notifications.templateError'),
        dismissible: true,
      })
      return
    }

    const csvContent = csvHeader.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cognito-import-template-${userPoolId}.csv`
    link.click()
    URL.revokeObjectURL(url)

    addNotification({
      id: `csv-dl-${String(Date.now())}`,
      type: 'success',
      content: t('notifications.templateDownloaded'),
      dismissible: true,
    })
  }

  const handleSubmit = () => {
    if (!validateStep(3)) return

    createJob.mutate(
      {
        UserPoolId: userPoolId,
        JobName: formState.jobName.trim(),
        CloudWatchLogsRoleArn: formState.iamRoleArn.trim(),
      },
      {
        onSuccess: (data) => {
          addNotification({
            id: `create-import-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.createSuccess', { name: formState.jobName.trim() }),
            dismissible: true,
          })
          const jobId = data.UserImportJob?.JobId
          if (jobId) {
            void navigate({
              to: '/user-pools/$userPoolId/import/$jobId',
              params: { userPoolId, jobId },
            })
          } else {
            void navigate({
              to: '/user-pools/$userPoolId/import',
              params: { userPoolId },
            })
          }
        },
        onError: () => {
          addNotification({
            id: `create-import-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.createError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleCancel = () => {
    void navigate({
      to: '/user-pools/$userPoolId/import',
      params: { userPoolId },
    })
  }

  return (
    <Wizard
      i18nStrings={{
        stepNumberLabel: (stepNumber) =>
          `${t('common:step')} ${String(stepNumber)}`,
        collapsedStepsLabel: (stepNumber, stepsCount) =>
          `${t('common:step')} ${String(stepNumber)} / ${String(stepsCount)}`,
        navigationAriaLabel: t('create.title'),
        cancelButton: t('create.form.cancelButton'),
        previousButton: t('create.form.previousButton'),
        nextButton: t('create.form.nextButton'),
        optional: t('common:optional'),
      }}
      onNavigate={handleNavigate}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isLoadingNextStep={createJob.isPending}
      activeStepIndex={activeStepIndex}
      submitButtonText={t('create.form.createButton')}
      steps={[
        {
          title: t('create.steps.jobName'),
          content: (
            <Container header={<Header variant="h2">{t('create.steps.jobName')}</Header>}>
              <FormField
                label={t('create.form.jobName')}
                constraintText={t('create.form.jobNameConstraint')}
                errorText={errors.jobName.length > 0 ? errors.jobName : undefined}
              >
                <Input
                  value={formState.jobName}
                  onChange={({ detail }) => {
                    setFormState((prev) => ({ ...prev, jobName: detail.value }))
                    if (errors.jobName.length > 0) setErrors((prev) => ({ ...prev, jobName: '' }))
                  }}
                  placeholder={t('create.form.jobNamePlaceholder')}
                />
              </FormField>
            </Container>
          ),
        },
        {
          title: t('create.steps.csvTemplate'),
          content: (
            <Container header={<Header variant="h2">{t('create.steps.csvTemplate')}</Header>}>
              <SpaceBetween size="l">
                <Box>{t('create.form.downloadTemplateDescription')}</Box>
                <Button
                  iconName="download"
                  onClick={handleDownloadTemplate}
                  loading={csvHeaderQuery.isLoading}
                >
                  {t('create.form.downloadButton')}
                </Button>
              </SpaceBetween>
            </Container>
          ),
          isOptional: true,
        },
        {
          title: t('create.steps.fileUpload'),
          content: (
            <Container header={<Header variant="h2">{t('create.steps.fileUpload')}</Header>}>
              <FormField
                label={t('create.form.uploadFile')}
                description={t('create.form.uploadFileDescription')}
                constraintText={t('create.form.uploadConstraint')}
                errorText={errors.csvFile.length > 0 ? errors.csvFile : undefined}
              >
                <FileUpload
                  value={formState.csvFile}
                  onChange={({ detail }) => {
                    setFormState((prev) => ({ ...prev, csvFile: detail.value }))
                    if (errors.csvFile.length > 0) setErrors((prev) => ({ ...prev, csvFile: '' }))
                  }}
                  i18nStrings={{
                    uploadButtonText: () => t('common:choose'),
                    dropzoneText: () => t('common:dropFile'),
                    removeFileAriaLabel: () => t('common:remove'),
                    errorIconAriaLabel: t('common:error'),
                    warningIconAriaLabel: t('common:warning'),
                    limitShowFewer: t('common:showFewer'),
                    limitShowMore: t('common:showMore'),
                  }}
                  accept=".csv"
                  constraintText={t('create.form.uploadConstraint')}
                />
              </FormField>
            </Container>
          ),
        },
        {
          title: t('create.steps.iamRole'),
          content: (
            <Container header={<Header variant="h2">{t('create.steps.iamRole')}</Header>}>
              <FormField
                label={t('create.form.iamRoleArn')}
                constraintText={t('create.form.iamRoleArnConstraint')}
                errorText={errors.iamRoleArn.length > 0 ? errors.iamRoleArn : undefined}
              >
                <Input
                  value={formState.iamRoleArn}
                  onChange={({ detail }) => {
                    setFormState((prev) => ({ ...prev, iamRoleArn: detail.value }))
                    if (errors.iamRoleArn.length > 0) setErrors((prev) => ({ ...prev, iamRoleArn: '' }))
                  }}
                  placeholder={t('create.form.iamRoleArnPlaceholder')}
                />
              </FormField>
            </Container>
          ),
        },
        {
          title: t('create.steps.review'),
          content: (
            <Container header={<Header variant="h2">{t('create.review.title')}</Header>}>
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">{t('create.review.jobName')}</Box>
                  <div>{formState.jobName}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('create.review.csvFile')}</Box>
                  <div>{formState.csvFile[0]?.name ?? t('create.review.noFile')}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('create.review.iamRoleArn')}</Box>
                  <div>{formState.iamRoleArn}</div>
                </div>
              </ColumnLayout>
            </Container>
          ),
        },
      ]}
    />
  )
}

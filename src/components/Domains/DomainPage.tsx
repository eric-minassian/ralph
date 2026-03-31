import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Container from '@cloudscape-design/components/container'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import Spinner from '@cloudscape-design/components/spinner'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Form from '@cloudscape-design/components/form'
import RadioGroup from '@cloudscape-design/components/radio-group'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import type { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator'
import Modal from '@cloudscape-design/components/modal'
import Link from '@cloudscape-design/components/link'
import type { DomainDescriptionType } from '@aws-sdk/client-cognito-identity-provider'
import { useDescribeUserPool } from '../../api/hooks/useUserPools'
import {
  useDescribeDomainByUserPool,
  useCreateUserPoolDomain,
  useUpdateUserPoolDomain,
  useDeleteUserPoolDomain,
} from '../../api/hooks/useDomains'
import { useNotifications } from '../../hooks/useNotifications'
import { PermissionGate } from '../PermissionGate'

interface DomainPageProps {
  userPoolId: string
}

type DomainType = 'prefix' | 'custom'

const ACM_ARN_PATTERN = /^arn:aws:acm:us-east-1:\d{12}:certificate\/.+$/
const PREFIX_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

function getStatusType(status: string | undefined): StatusIndicatorProps.Type {
  if (status === 'ACTIVE') return 'success'
  if (status === 'CREATING' || status === 'UPDATING') return 'in-progress'
  if (status === 'DELETING') return 'in-progress'
  if (status === 'FAILED') return 'error'
  return 'info'
}

export function DomainPage({ userPoolId }: DomainPageProps) {
  const { t } = useTranslation('domains')

  const { data: poolData, isLoading: poolLoading } = useDescribeUserPool(userPoolId)
  const pool = poolData?.UserPool

  // Determine domain name from pool data
  const domainName = pool?.CustomDomain ?? pool?.Domain
  const hasDomain = (domainName ?? '').length > 0

  const { data: domainData, isLoading: domainLoading } = useDescribeDomainByUserPool(
    userPoolId,
    hasDomain ? domainName : undefined,
  )
  const domain = domainData?.DomainDescription

  const [showCreateForm, setShowCreateForm] = useState(false)

  if (poolLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" margin={{ top: 's' }}>
          {t('common:loading')}
        </Box>
      </Box>
    )
  }

  // Show create form if user explicitly clicked create
  if (showCreateForm) {
    return (
      <CreateDomainForm
        userPoolId={userPoolId}
        onCancel={() => { setShowCreateForm(false) }}
      />
    )
  }

  // No domain on pool — show empty state
  if (!hasDomain) {
    return (
      <Container
        header={<Header>{t('page.title')}</Header>}
      >
        <Box textAlign="center" padding="l">
          <SpaceBetween size="m">
            <Box variant="strong" color="text-body-secondary">
              {t('page.noDomainTitle')}
            </Box>
            <Box color="text-body-secondary">
              {t('page.noDomainDescription')}
            </Box>
            <PermissionGate permission="CreateUserPoolDomain">
              <Button variant="primary" onClick={() => { setShowCreateForm(true) }}>
                {t('page.createButton')}
              </Button>
            </PermissionGate>
          </SpaceBetween>
        </Box>
      </Container>
    )
  }

  if (domainLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" margin={{ top: 's' }}>
          {t('common:loading')}
        </Box>
      </Box>
    )
  }

  // Domain exists but describe returned empty (should not happen normally)
  if (!domain?.Domain) {
    return (
      <Container
        header={<Header>{t('page.title')}</Header>}
      >
        <Box textAlign="center" padding="l">
          <SpaceBetween size="m">
            <Box variant="strong" color="text-body-secondary">
              {t('page.noDomainTitle')}
            </Box>
            <Box color="text-body-secondary">
              {t('page.noDomainDescription')}
            </Box>
            <PermissionGate permission="CreateUserPoolDomain">
              <Button variant="primary" onClick={() => { setShowCreateForm(true) }}>
                {t('page.createButton')}
              </Button>
            </PermissionGate>
          </SpaceBetween>
        </Box>
      </Container>
    )
  }

  return (
    <DomainDetail
      userPoolId={userPoolId}
      domain={domain}
      onDeleted={() => { setShowCreateForm(false) }}
    />
  )
}

// ── Create Domain Form ──────────────────────────────────────────────

interface CreateDomainFormProps {
  userPoolId: string
  onCancel: () => void
}

function CreateDomainForm({ userPoolId, onCancel }: CreateDomainFormProps) {
  const { t } = useTranslation('domains')
  const { addNotification } = useNotifications()
  const createMutation = useCreateUserPoolDomain()

  const [domainType, setDomainType] = useState<DomainType>('prefix')
  const [prefix, setPrefix] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [certificateArn, setCertificateArn] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const region = import.meta.env.VITE_AWS_REGION ?? 'us-east-1'

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (domainType === 'prefix') {
      if (prefix.trim().length === 0) {
        newErrors.prefix = t('validation.prefixRequired')
      } else if (!PREFIX_PATTERN.test(prefix.trim())) {
        newErrors.prefix = t('validation.prefixFormat')
      }
    } else {
      if (customDomain.trim().length === 0) {
        newErrors.customDomain = t('validation.customDomainRequired')
      } else if (!DOMAIN_PATTERN.test(customDomain.trim().toLowerCase())) {
        newErrors.customDomain = t('validation.customDomainFormat')
      }
      if (certificateArn.trim().length === 0) {
        newErrors.certificateArn = t('validation.certificateArnRequired')
      } else if (!ACM_ARN_PATTERN.test(certificateArn.trim())) {
        newErrors.certificateArn = t('validation.certificateArnFormat')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const domainValue = domainType === 'prefix' ? prefix.trim() : customDomain.trim().toLowerCase()

    createMutation.mutate(
      {
        Domain: domainValue,
        UserPoolId: userPoolId,
        ...(domainType === 'custom'
          ? { CustomDomainConfig: { CertificateArn: certificateArn.trim() } }
          : {}),
      },
      {
        onSuccess: () => {
          addNotification({
            id: `domain-create-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.createSuccess'),
            dismissible: true,
          })
          // Reset form state - the parent will re-fetch pool data and show detail
          setPrefix('')
          setCustomDomain('')
          setCertificateArn('')
        },
        onError: (error) => {
          addNotification({
            id: `domain-create-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.createError', { message: error.message }),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <Form
      header={<Header>{t('create.title')}</Header>}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onCancel}>
            {t('create.cancelButton')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={createMutation.isPending}>
            {t('create.submitButton')}
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l">
        <FormField label={t('create.domainTypeLabel')}>
          <RadioGroup
            value={domainType}
            onChange={({ detail }) => {
              if (detail.value === 'prefix' || detail.value === 'custom') {
                setDomainType(detail.value)
                setErrors({})
              }
            }}
            items={[
              { value: 'prefix', label: t('create.prefixOption'), description: t('create.prefixDescription') },
              { value: 'custom', label: t('create.customOption'), description: t('create.customDescription') },
            ]}
          />
        </FormField>

        {domainType === 'prefix' ? (
          <FormField
            label={t('create.prefixLabel')}
            description={t('create.prefixHelp')}
            errorText={errors.prefix}
          >
            <SpaceBetween size="xs" direction="horizontal" alignItems="center">
              <Input
                value={prefix}
                onChange={({ detail }) => { setPrefix(detail.value) }}
                placeholder="my-app"
              />
              <Box variant="small" color="text-body-secondary">
                {t('create.prefixSuffix', { region })}
              </Box>
            </SpaceBetween>
          </FormField>
        ) : (
          <SpaceBetween size="l">
            <FormField
              label={t('create.customDomainLabel')}
              description={t('create.customDomainHelp')}
              errorText={errors.customDomain}
            >
              <Input
                value={customDomain}
                onChange={({ detail }) => { setCustomDomain(detail.value) }}
                placeholder="auth.example.com"
              />
            </FormField>
            <FormField
              label={t('create.certificateArnLabel')}
              description={t('create.certificateArnHelp')}
              errorText={errors.certificateArn}
            >
              <Input
                value={certificateArn}
                onChange={({ detail }) => { setCertificateArn(detail.value) }}
                placeholder="arn:aws:acm:us-east-1:123456789012:certificate/..."
              />
            </FormField>
          </SpaceBetween>
        )}
      </SpaceBetween>
    </Form>
  )
}

// ── Domain Detail ───────────────────────────────────────────────────

interface DomainDetailProps {
  userPoolId: string
  domain: DomainDescriptionType
  onDeleted: () => void
}

function DomainDetail({ userPoolId, domain, onDeleted }: DomainDetailProps) {
  const { t } = useTranslation('domains')
  const { addNotification } = useNotifications()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const deleteMutation = useDeleteUserPoolDomain()
  const updateMutation = useUpdateUserPoolDomain()

  const isCustom = domain.CustomDomainConfig !== undefined
  const region = import.meta.env.VITE_AWS_REGION ?? 'us-east-1'

  const fullUrl = isCustom
    ? `https://${domain.Domain ?? ''}`
    : `https://${domain.Domain ?? ''}.auth.${region}.amazoncognito.com`

  function handleDelete() {
    deleteMutation.mutate(
      { Domain: domain.Domain ?? '', UserPoolId: userPoolId },
      {
        onSuccess: () => {
          addNotification({
            id: `domain-delete-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteSuccess'),
            dismissible: true,
          })
          setShowDeleteModal(false)
          onDeleted()
        },
        onError: (error) => {
          addNotification({
            id: `domain-delete-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.deleteError', { message: error.message }),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <>
      <Container
        header={
          <Header
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                {isCustom && (
                  <PermissionGate permission="UpdateUserPoolDomain">
                    <Button onClick={() => { setShowEditModal(true) }}>
                      {t('detail.editButton')}
                    </Button>
                  </PermissionGate>
                )}
                <PermissionGate permission="DeleteUserPoolDomain">
                  <Button onClick={() => { setShowDeleteModal(true) }}>
                    {t('detail.deleteButton')}
                  </Button>
                </PermissionGate>
              </SpaceBetween>
            }
          >
            {t('detail.title', { domain: domain.Domain })}
          </Header>
        }
      >
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween size="l">
            <div>
              <Box variant="awsui-key-label">{t('detail.domainUrl')}</Box>
              <Link href={fullUrl} external>{fullUrl}</Link>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.domainName')}</Box>
              <Box>{domain.Domain}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.domainType')}</Box>
              <Box>{isCustom ? t('detail.customType') : t('detail.prefixType')}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.status')}</Box>
              <StatusIndicator type={getStatusType(domain.Status)}>
                {t(`status.${domain.Status ?? 'ACTIVE'}`)}
              </StatusIndicator>
            </div>
          </SpaceBetween>
          <SpaceBetween size="l">
            {isCustom && domain.CloudFrontDistribution && (
              <div>
                <Box variant="awsui-key-label">{t('detail.cloudFrontDistribution')}</Box>
                <Box>{domain.CloudFrontDistribution}</Box>
              </div>
            )}
            {isCustom && domain.CustomDomainConfig?.CertificateArn && (
              <div>
                <Box variant="awsui-key-label">{t('detail.certificateArn')}</Box>
                <Box>{domain.CustomDomainConfig.CertificateArn}</Box>
              </div>
            )}
            <div>
              <Box variant="awsui-key-label">{t('detail.userPoolId')}</Box>
              <Box>{domain.UserPoolId}</Box>
            </div>
            {domain.AWSAccountId && (
              <div>
                <Box variant="awsui-key-label">{t('detail.awsAccountId')}</Box>
                <Box>{domain.AWSAccountId}</Box>
              </div>
            )}
          </SpaceBetween>
        </ColumnLayout>

        <Box margin={{ top: 'l' }}>
          <Link href={`${fullUrl}/login?client_id=placeholder&response_type=code&redirect_uri=http://localhost`} external>
            {t('detail.openHostedUi')}
          </Link>
        </Box>
      </Container>

      {showDeleteModal && (
        <Modal
          visible
          onDismiss={() => { setShowDeleteModal(false) }}
          header={t('delete.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setShowDeleteModal(false) }}>
                  {t('delete.cancelLabel')}
                </Button>
                <Button variant="primary" onClick={handleDelete} loading={deleteMutation.isPending}>
                  {t('delete.confirmLabel')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {t('delete.confirmMessage', { domain: domain.Domain })}
        </Modal>
      )}

      {showEditModal && isCustom && (
        <EditDomainModal
          userPoolId={userPoolId}
          domainName={domain.Domain ?? ''}
          currentCertificateArn={domain.CustomDomainConfig?.CertificateArn ?? ''}
          onDismiss={() => { setShowEditModal(false) }}
          onSuccess={() => {
            setShowEditModal(false)
            addNotification({
              id: `domain-update-${String(Date.now())}`,
              type: 'success',
              content: t('notifications.updateSuccess'),
              dismissible: true,
            })
          }}
          updateMutation={updateMutation}
        />
      )}
    </>
  )
}

// ── Edit Domain Modal ───────────────────────────────────────────────

interface EditDomainModalProps {
  userPoolId: string
  domainName: string
  currentCertificateArn: string
  onDismiss: () => void
  onSuccess: () => void
  updateMutation: ReturnType<typeof useUpdateUserPoolDomain>
}

function EditDomainModal({
  userPoolId,
  domainName,
  currentCertificateArn,
  onDismiss,
  onSuccess,
  updateMutation,
}: EditDomainModalProps) {
  const { t } = useTranslation('domains')
  const { addNotification } = useNotifications()
  const [certificateArn, setCertificateArn] = useState(currentCertificateArn)
  const [error, setError] = useState('')

  function handleSubmit() {
    if (certificateArn.trim().length === 0) {
      setError(t('validation.certificateArnRequired'))
      return
    }
    if (!ACM_ARN_PATTERN.test(certificateArn.trim())) {
      setError(t('validation.certificateArnFormat'))
      return
    }

    updateMutation.mutate(
      {
        Domain: domainName,
        UserPoolId: userPoolId,
        CustomDomainConfig: { CertificateArn: certificateArn.trim() },
      },
      {
        onSuccess,
        onError: (err) => {
          addNotification({
            id: `domain-update-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.updateError', { message: err.message }),
            dismissible: true,
          })
        },
      },
    )
  }

  return (
    <Modal
      visible
      onDismiss={onDismiss}
      header={t('edit.title')}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              {t('edit.cancelButton')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={updateMutation.isPending}>
              {t('edit.submitButton')}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <FormField
        label={t('edit.certificateArnLabel')}
        errorText={error}
      >
        <Input
          value={certificateArn}
          onChange={({ detail }) => {
            setCertificateArn(detail.value)
            setError('')
          }}
        />
      </FormField>
    </Modal>
  )
}

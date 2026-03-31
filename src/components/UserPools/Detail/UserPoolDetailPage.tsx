import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Tabs from '@cloudscape-design/components/tabs'
import Box from '@cloudscape-design/components/box'
import Spinner from '@cloudscape-design/components/spinner'
import Alert from '@cloudscape-design/components/alert'
import { useDescribeUserPool, useGetUserPoolMfaConfig } from '../../../api/hooks/useUserPools'
import { PermissionGate } from '../../PermissionGate'
import { GeneralSection } from './GeneralSection'
import { SignInSection } from './SignInSection'
import { PasswordPolicySection } from './PasswordPolicySection'
import { MfaSection } from './MfaSection'
import { CustomAttributesSection } from './CustomAttributesSection'
import { DeletionProtectionSection } from './DeletionProtectionSection'
import { DeleteUserPoolModal } from './DeleteUserPoolModal'

interface UserPoolDetailPageProps {
  userPoolId: string
}

export function UserPoolDetailPage({ userPoolId }: UserPoolDetailPageProps) {
  const { t } = useTranslation('userPools')
  const navigate = useNavigate()
  const { data, isLoading, isError } = useDescribeUserPool(userPoolId)
  const mfaConfig = useGetUserPoolMfaConfig(userPoolId)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [activeTabId, setActiveTabId] = useState('overview')

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" margin={{ top: 's' }}>
          {t('detail.loading')}
        </Box>
      </Box>
    )
  }

  if (isError || !data?.UserPool) {
    return (
      <Alert
        type="error"
        header={t('detail.notFound')}
        action={
          <Button onClick={() => { void navigate({ to: '/user-pools' }) }}>
            {t('detail.backToList')}
          </Button>
        }
      >
        {t('detail.notFoundDescription')}
      </Alert>
    )
  }

  const userPool = data.UserPool

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <PermissionGate permission="DeleteUserPool">
              <Button
                onClick={() => { setShowDeleteModal(true) }}
              >
                {t('detail.deleteButton')}
              </Button>
            </PermissionGate>
          </SpaceBetween>
        }
      >
        {t('detail.title', { name: userPool.Name ?? '' })}
      </Header>

      <Tabs
        activeTabId={activeTabId}
        onChange={({ detail }) => { setActiveTabId(detail.activeTabId) }}
        tabs={[
          {
            id: 'overview',
            label: t('detail.tabs.overview'),
            content: (
              <SpaceBetween size="l">
                <GeneralSection userPool={userPool} />
                <SignInSection userPool={userPool} />
                <PasswordPolicySection userPool={userPool} />
                <MfaSection
                  userPoolId={userPoolId}
                  mfaConfig={mfaConfig.data}
                  isLoading={mfaConfig.isLoading}
                />
                <CustomAttributesSection
                  userPoolId={userPoolId}
                  userPool={userPool}
                />
                <DeletionProtectionSection userPool={userPool} />
              </SpaceBetween>
            ),
          },
          {
            id: 'users',
            label: t('detail.tabs.users'),
            content: <Box padding="l">{t('detail.tabs.users')}</Box>,
          },
          {
            id: 'groups',
            label: t('detail.tabs.groups'),
            content: <Box padding="l">{t('detail.tabs.groups')}</Box>,
          },
          {
            id: 'appClients',
            label: t('detail.tabs.appClients'),
            content: <Box padding="l">{t('detail.tabs.appClients')}</Box>,
          },
          {
            id: 'identityProviders',
            label: t('detail.tabs.identityProviders'),
            content: <Box padding="l">{t('detail.tabs.identityProviders')}</Box>,
          },
        ]}
      />

      {showDeleteModal && (
        <DeleteUserPoolModal
          userPool={userPool}
          onDismiss={() => { setShowDeleteModal(false) }}
        />
      )}
    </SpaceBetween>
  )
}

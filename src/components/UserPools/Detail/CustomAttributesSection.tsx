import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import Table from '@cloudscape-design/components/table'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import type { UserPoolType, SchemaAttributeType } from '@aws-sdk/client-cognito-identity-provider'
import { PermissionGate } from '../../PermissionGate'
import { AddCustomAttributeModal } from './AddCustomAttributeModal'

interface CustomAttributesSectionProps {
  userPoolId: string
  userPool: UserPoolType
}

export function CustomAttributesSection({ userPoolId, userPool }: CustomAttributesSectionProps) {
  const { t } = useTranslation('userPools')
  const [showAddModal, setShowAddModal] = useState(false)

  const customAttributes = (userPool.SchemaAttributes ?? []).filter(
    (attr) => attr.Name?.startsWith('custom:') === true,
  )

  return (
    <>
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <PermissionGate permission="AddCustomAttributes">
                <Button onClick={() => { setShowAddModal(true) }}>
                  {t('detail.customAttributes.addButton')}
                </Button>
              </PermissionGate>
            }
          >
            {t('detail.customAttributes.title')}
          </Header>
        }
      >
        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: t('detail.customAttributes.name'),
              cell: (item: SchemaAttributeType) => item.Name ?? '—',
            },
            {
              id: 'dataType',
              header: t('detail.customAttributes.dataType'),
              cell: (item: SchemaAttributeType) => item.AttributeDataType ?? '—',
            },
            {
              id: 'mutable',
              header: t('detail.customAttributes.mutable'),
              cell: (item: SchemaAttributeType) =>
                item.Mutable === true
                  ? t('detail.customAttributes.yes')
                  : t('detail.customAttributes.no'),
            },
            {
              id: 'required',
              header: t('detail.customAttributes.required'),
              cell: (item: SchemaAttributeType) =>
                item.Required === true
                  ? t('detail.customAttributes.yes')
                  : t('detail.customAttributes.no'),
            },
          ]}
          items={customAttributes}
          variant="embedded"
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="s">
              {t('detail.customAttributes.empty')}
            </Box>
          }
        />
      </Container>

      {showAddModal && (
        <AddCustomAttributeModal
          userPoolId={userPoolId}
          onDismiss={() => { setShowAddModal(false) }}
        />
      )}
    </>
  )
}

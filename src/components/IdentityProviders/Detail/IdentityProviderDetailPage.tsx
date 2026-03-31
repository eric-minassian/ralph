import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import Spinner from '@cloudscape-design/components/spinner'
import Alert from '@cloudscape-design/components/alert'
import Container from '@cloudscape-design/components/container'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Modal from '@cloudscape-design/components/modal'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Textarea from '@cloudscape-design/components/textarea'
import Table from '@cloudscape-design/components/table'
import Select from '@cloudscape-design/components/select'
import Toggle from '@cloudscape-design/components/toggle'
import RadioGroup from '@cloudscape-design/components/radio-group'
import { useDescribeIdentityProvider, useUpdateIdentityProvider, useDeleteIdentityProvider } from '../../../api/hooks/useIdentityProviders'
import { useNotifications } from '../../../hooks/useNotifications'
import { PermissionGate } from '../../PermissionGate'

interface IdentityProviderDetailPageProps {
  userPoolId: string
  providerName: string
}

type ModalState =
  | { type: 'delete'; confirmText: string }
  | { type: 'edit' }

const COGNITO_ATTRIBUTES = [
  'email', 'name', 'given_name', 'family_name', 'phone_number',
  'preferred_username', 'profile', 'picture', 'website', 'gender',
  'birthdate', 'zoneinfo', 'locale', 'address', 'nickname',
  'middle_name', 'updated_at',
]

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  SAML: 'SAML',
  OIDC: 'OIDC',
  Facebook: 'Facebook',
  Google: 'Google',
  LoginWithAmazon: 'Login with Amazon',
  SignInWithApple: 'Sign in with Apple',
}

const SOCIAL_TYPES = new Set(['Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'])

interface EditMappingEntry {
  id: string
  cognitoAttribute: string
  providerAttribute: string
}

let editEntryId = 0
function nextEditEntryId(): string {
  editEntryId += 1
  return `edit-entry-${String(editEntryId)}`
}

function formatDate(date: Date | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function IdentityProviderDetailPage({ userPoolId, providerName }: IdentityProviderDetailPageProps) {
  const { t } = useTranslation('identityProviders')
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const providerQuery = useDescribeIdentityProvider(userPoolId, providerName)
  const updateProvider = useUpdateIdentityProvider()
  const deleteProvider = useDeleteIdentityProvider()

  const [modal, setModal] = useState<ModalState | null>(null)

  // Edit state
  const [editDetails, setEditDetails] = useState<Record<string, string>>({})
  const [editMapping, setEditMapping] = useState<EditMappingEntry[]>([])
  const [editIdpIdentifiers, setEditIdpIdentifiers] = useState('')

  // SAML edit toggles
  const [editIdpSignout, setEditIdpSignout] = useState(false)
  const [editIdpInit, setEditIdpInit] = useState(false)
  const [editEncrypted, setEditEncrypted] = useState(false)
  const [editSigningAlg, setEditSigningAlg] = useState('rsa-sha256')
  const [editMetadataSource, setEditMetadataSource] = useState<'url' | 'file'>('url')

  const { data, isLoading, isError } = providerQuery
  const provider = data?.IdentityProvider

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" padding="s">{t('detail.loading')}</Box>
      </Box>
    )
  }

  if (isError || !provider) {
    return (
      <Alert
        type="error"
        header={t('detail.notFound')}
        action={
          <Button onClick={() => {
            void navigate({ to: '/user-pools/$userPoolId/identity-providers', params: { userPoolId } })
          }}>
            {t('detail.backToList')}
          </Button>
        }
      >
        {t('detail.notFoundDescription')}
      </Alert>
    )
  }

  const providerType = provider.ProviderType ?? ''
  const details = provider.ProviderDetails ?? {}
  const mapping = provider.AttributeMapping ?? {}
  const isSocial = SOCIAL_TYPES.has(providerType)

  const openEditModal = () => {
    setEditDetails({ ...details })
    setEditMapping(
      Object.entries(mapping).map(([cognito, idp]) => ({
        id: nextEditEntryId(),
        cognitoAttribute: cognito,
        providerAttribute: idp,
      })),
    )
    setEditIdpIdentifiers((provider.IdpIdentifiers ?? []).join(', '))

    // SAML edit state
    if (providerType === 'SAML') {
      setEditIdpSignout(details.IDPSignout === 'true')
      setEditIdpInit(details.IDPInit === 'true')
      setEditEncrypted(details.EncryptedResponses === 'true')
      setEditSigningAlg(details.RequestSigningAlgorithm ?? 'rsa-sha256')
      setEditMetadataSource(details.MetadataURL ? 'url' : 'file')
    }

    setModal({ type: 'edit' })
  }

  const handleDelete = () => {
    if (modal?.type !== 'delete' || modal.confirmText !== providerName) return
    deleteProvider.mutate(
      { UserPoolId: userPoolId, ProviderName: providerName },
      {
        onSuccess: () => {
          addNotification({
            id: `delete-idp-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.deleteSuccess', { name: providerName }),
            dismissible: true,
          })
          void navigate({ to: '/user-pools/$userPoolId/identity-providers', params: { userPoolId } })
        },
        onError: () => {
          addNotification({
            id: `delete-idp-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.deleteError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const handleEdit = () => {
    if (modal?.type !== 'edit') return

    let providerDetails: Record<string, string>
    if (providerType === 'SAML') {
      providerDetails = { ...editDetails }
      providerDetails.IDPSignout = String(editIdpSignout)
      providerDetails.IDPInit = String(editIdpInit)
      providerDetails.EncryptedResponses = String(editEncrypted)
      providerDetails.RequestSigningAlgorithm = editSigningAlg
      if (editMetadataSource === 'url') {
        delete providerDetails.MetadataFile
      } else {
        delete providerDetails.MetadataURL
      }
    } else {
      providerDetails = { ...editDetails }
    }

    const attributeMapping: Record<string, string> = {}
    for (const entry of editMapping) {
      if (entry.cognitoAttribute.length > 0 && entry.providerAttribute.length > 0) {
        attributeMapping[entry.cognitoAttribute] = entry.providerAttribute
      }
    }

    const idpIds = editIdpIdentifiers.trim().length > 0
      ? editIdpIdentifiers.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : []

    updateProvider.mutate(
      {
        UserPoolId: userPoolId,
        ProviderName: providerName,
        ProviderDetails: providerDetails,
        AttributeMapping: attributeMapping,
        IdpIdentifiers: idpIds,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `update-idp-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.updateSuccess', { name: providerName }),
            dismissible: true,
          })
          setModal(null)
        },
        onError: () => {
          addNotification({
            id: `update-idp-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.updateError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const addEditMapping = () => {
    setEditMapping([...editMapping, { id: nextEditEntryId(), cognitoAttribute: '', providerAttribute: '' }])
  }

  const removeEditMapping = (id: string) => {
    setEditMapping(editMapping.filter((e) => e.id !== id))
  }

  const updateEditMapping = (id: string, field: 'cognitoAttribute' | 'providerAttribute', value: string) => {
    setEditMapping(editMapping.map((e) => e.id === id ? { ...e, [field]: value } : e))
  }

  const updateEditDetail = (key: string, value: string) => {
    setEditDetails({ ...editDetails, [key]: value })
  }

  const mappingEntries = Object.entries(mapping)

  return (
    <>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <PermissionGate permission="UpdateIdentityProvider">
                <Button onClick={openEditModal}>
                  {t('detail.editButton')}
                </Button>
              </PermissionGate>
              <PermissionGate permission="DeleteIdentityProvider">
                <Button onClick={() => { setModal({ type: 'delete', confirmText: '' }) }}>
                  {t('detail.deleteButton')}
                </Button>
              </PermissionGate>
            </SpaceBetween>
          }
        >
          {t('detail.title', { name: providerName })}
        </Header>

        {/* General settings */}
        <Container header={<Header variant="h2">{t('detail.general.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('detail.general.providerName')}</Box>
              <div>{provider.ProviderName ?? '—'}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.providerType')}</Box>
              <div>{PROVIDER_TYPE_LABELS[providerType] ?? providerType}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.creationDate')}</Box>
              <div>{formatDate(provider.CreationDate)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.lastModifiedDate')}</Box>
              <div>{formatDate(provider.LastModifiedDate)}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('detail.general.idpIdentifiers')}</Box>
              <div>
                {provider.IdpIdentifiers && provider.IdpIdentifiers.length > 0
                  ? provider.IdpIdentifiers.join(', ')
                  : t('detail.general.noneSet')}
              </div>
            </div>
          </ColumnLayout>
        </Container>

        {/* Provider details */}
        <Container header={<Header variant="h2">{t('detail.providerDetails.title')}</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            {providerType === 'SAML' && (
              <>
                {details.MetadataURL && (
                  <div>
                    <Box variant="awsui-key-label">{t('detail.providerDetails.metadataURL')}</Box>
                    <div>{details.MetadataURL}</div>
                  </div>
                )}
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.idpSignout')}</Box>
                  <div>{details.IDPSignout === 'true' ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.idpInit')}</Box>
                  <div>{details.IDPInit === 'true' ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.encryptedResponses')}</Box>
                  <div>{details.EncryptedResponses === 'true' ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.requestSigningAlgorithm')}</Box>
                  <div>{details.RequestSigningAlgorithm ?? '—'}</div>
                </div>
              </>
            )}
            {providerType === 'OIDC' && (
              <>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.clientId')}</Box>
                  <div>{details.client_id ?? '—'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.oidcIssuer')}</Box>
                  <div>{details.oidc_issuer ?? '—'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.authorizeScopes')}</Box>
                  <div>{details.authorize_scopes ?? '—'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.attributesRequestMethod')}</Box>
                  <div>{details.attributes_request_method ?? '—'}</div>
                </div>
              </>
            )}
            {isSocial && (
              <>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.clientId')}</Box>
                  <div>{details.client_id ?? '—'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">{t('detail.providerDetails.authorizeScopes')}</Box>
                  <div>{details.authorize_scopes ?? '—'}</div>
                </div>
              </>
            )}
          </ColumnLayout>
        </Container>

        {/* Attribute mapping */}
        <Table
          columnDefinitions={[
            {
              id: 'cognitoAttribute',
              header: t('detail.attributeMapping.cognitoAttribute'),
              cell: (item: [string, string]) => item[0],
              isRowHeader: true,
            },
            {
              id: 'providerAttribute',
              header: t('detail.attributeMapping.providerAttribute'),
              cell: (item: [string, string]) => item[1],
            },
          ]}
          items={mappingEntries}
          variant="embedded"
          header={
            <Header variant="h2">
              {t('detail.attributeMapping.title')}
            </Header>
          }
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="s">
              {t('detail.attributeMapping.empty')}
            </Box>
          }
        />
      </SpaceBetween>

      {/* Delete modal */}
      {modal?.type === 'delete' && (
        <Modal
          visible
          onDismiss={() => { setModal(null) }}
          header={t('detail.delete.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.delete.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  loading={deleteProvider.isPending}
                  disabled={modal.confirmText !== providerName}
                >
                  {t('detail.delete.deleteButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <Box>{t('detail.delete.description')}</Box>
            <FormField label={t('detail.delete.confirmLabel')}>
              <Input
                value={modal.confirmText}
                onChange={({ detail }) => { setModal({ type: 'delete', confirmText: detail.value }) }}
                placeholder={t('detail.delete.confirmPlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}

      {/* Edit modal */}
      {modal?.type === 'edit' && (
        <Modal
          visible
          size="large"
          onDismiss={() => { setModal(null) }}
          header={t('detail.edit.title')}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setModal(null) }}>
                  {t('detail.edit.cancelButton')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEdit}
                  loading={updateProvider.isPending}
                >
                  {t('detail.edit.saveButton')}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="l">
            {/* IdP identifiers */}
            <FormField
              label={t('create.form.idpIdentifiers')}
              constraintText={t('create.form.idpIdentifiersConstraint')}
            >
              <Input
                value={editIdpIdentifiers}
                onChange={({ detail }) => { setEditIdpIdentifiers(detail.value) }}
                placeholder={t('create.form.idpIdentifiersPlaceholder')}
              />
            </FormField>

            {/* SAML edit fields */}
            {providerType === 'SAML' && (
              <SpaceBetween size="l">
                <FormField label={t('create.form.saml.metadataSource')}>
                  <RadioGroup
                    value={editMetadataSource}
                    onChange={({ detail }) => {
                      if (detail.value === 'url' || detail.value === 'file') {
                        setEditMetadataSource(detail.value)
                      }
                    }}
                    items={[
                      { value: 'url', label: t('create.form.saml.metadataSourceUrl') },
                      { value: 'file', label: t('create.form.saml.metadataSourceFile') },
                    ]}
                  />
                </FormField>
                {editMetadataSource === 'url' ? (
                  <FormField label={t('create.form.saml.metadataURL')}>
                    <Input
                      value={editDetails.MetadataURL ?? ''}
                      onChange={({ detail }) => { updateEditDetail('MetadataURL', detail.value) }}
                      placeholder={t('create.form.saml.metadataURLPlaceholder')}
                    />
                  </FormField>
                ) : (
                  <FormField label={t('create.form.saml.metadataFile')}>
                    <Textarea
                      value={editDetails.MetadataFile ?? ''}
                      onChange={({ detail }) => { updateEditDetail('MetadataFile', detail.value) }}
                      placeholder={t('create.form.saml.metadataFilePlaceholder')}
                      rows={8}
                    />
                  </FormField>
                )}
                <Toggle
                  checked={editIdpSignout}
                  onChange={({ detail }) => { setEditIdpSignout(detail.checked) }}
                >
                  {t('create.form.saml.idpSignout')}
                </Toggle>
                <Toggle
                  checked={editIdpInit}
                  onChange={({ detail }) => { setEditIdpInit(detail.checked) }}
                >
                  {t('create.form.saml.idpInit')}
                </Toggle>
                <Toggle
                  checked={editEncrypted}
                  onChange={({ detail }) => { setEditEncrypted(detail.checked) }}
                >
                  {t('create.form.saml.encryptedResponses')}
                </Toggle>
                <FormField label={t('create.form.saml.requestSigningAlgorithm')}>
                  <RadioGroup
                    value={editSigningAlg}
                    onChange={({ detail }) => { setEditSigningAlg(detail.value) }}
                    items={[
                      { value: 'rsa-sha256', label: t('create.form.saml.rsaSha256') },
                      { value: 'rsa-sha1', label: t('create.form.saml.rsaSha1') },
                    ]}
                  />
                </FormField>
              </SpaceBetween>
            )}

            {/* OIDC edit fields */}
            {providerType === 'OIDC' && (
              <SpaceBetween size="l">
                <FormField label={t('create.form.oidc.clientId')}>
                  <Input
                    value={editDetails.client_id ?? ''}
                    onChange={({ detail }) => { updateEditDetail('client_id', detail.value) }}
                    placeholder={t('create.form.oidc.clientIdPlaceholder')}
                  />
                </FormField>
                <FormField label={t('create.form.oidc.clientSecret')}>
                  <Input
                    value={editDetails.client_secret ?? ''}
                    onChange={({ detail }) => { updateEditDetail('client_secret', detail.value) }}
                    placeholder={t('create.form.oidc.clientSecretPlaceholder')}
                    type="password"
                  />
                </FormField>
                <FormField label={t('create.form.oidc.issuerUrl')}>
                  <Input
                    value={editDetails.oidc_issuer ?? ''}
                    onChange={({ detail }) => { updateEditDetail('oidc_issuer', detail.value) }}
                    placeholder={t('create.form.oidc.issuerUrlPlaceholder')}
                  />
                </FormField>
                <FormField label={t('create.form.oidc.authorizeScopes')}>
                  <Input
                    value={editDetails.authorize_scopes ?? ''}
                    onChange={({ detail }) => { updateEditDetail('authorize_scopes', detail.value) }}
                    placeholder={t('create.form.oidc.authorizeScopesPlaceholder')}
                  />
                </FormField>
                <FormField label={t('create.form.oidc.attributesRequestMethod')}>
                  <RadioGroup
                    value={editDetails.attributes_request_method ?? 'GET'}
                    onChange={({ detail }) => { updateEditDetail('attributes_request_method', detail.value) }}
                    items={[
                      { value: 'GET', label: t('create.form.oidc.methodGet') },
                      { value: 'POST', label: t('create.form.oidc.methodPost') },
                    ]}
                  />
                </FormField>
              </SpaceBetween>
            )}

            {/* Social edit fields */}
            {isSocial && (
              <SpaceBetween size="l">
                <FormField label={t('create.form.social.clientId')}>
                  <Input
                    value={editDetails.client_id ?? ''}
                    onChange={({ detail }) => { updateEditDetail('client_id', detail.value) }}
                    placeholder={t('create.form.social.clientIdPlaceholder')}
                  />
                </FormField>
                <FormField label={t('create.form.social.clientSecret')}>
                  <Input
                    value={editDetails.client_secret ?? ''}
                    onChange={({ detail }) => { updateEditDetail('client_secret', detail.value) }}
                    placeholder={t('create.form.social.clientSecretPlaceholder')}
                    type="password"
                  />
                </FormField>
                <FormField label={t('create.form.social.authorizeScopes')}>
                  <Input
                    value={editDetails.authorize_scopes ?? ''}
                    onChange={({ detail }) => { updateEditDetail('authorize_scopes', detail.value) }}
                    placeholder={t('create.form.social.authorizeScopesPlaceholder')}
                  />
                </FormField>
              </SpaceBetween>
            )}

            {/* Attribute mapping editor */}
            <SpaceBetween size="m">
              <Header variant="h3">{t('create.form.attributeMapping.title')}</Header>
              <Table
                columnDefinitions={[
                  {
                    id: 'cognitoAttribute',
                    header: t('create.form.attributeMapping.cognitoAttribute'),
                    cell: (item: EditMappingEntry) => (
                      <Select
                        selectedOption={item.cognitoAttribute ? { value: item.cognitoAttribute, label: item.cognitoAttribute } : null}
                        onChange={({ detail }) => {
                          updateEditMapping(item.id, 'cognitoAttribute', detail.selectedOption.value ?? '')
                        }}
                        options={COGNITO_ATTRIBUTES.map((a) => ({ value: a, label: a }))}
                        placeholder={t('create.form.attributeMapping.cognitoAttributePlaceholder')}
                      />
                    ),
                    width: 250,
                  },
                  {
                    id: 'providerAttribute',
                    header: t('create.form.attributeMapping.providerAttribute'),
                    cell: (item: EditMappingEntry) => (
                      <Input
                        value={item.providerAttribute}
                        onChange={({ detail }) => {
                          updateEditMapping(item.id, 'providerAttribute', detail.value)
                        }}
                        placeholder={t('create.form.attributeMapping.providerAttributePlaceholder')}
                      />
                    ),
                  },
                  {
                    id: 'actions',
                    header: '',
                    cell: (item: EditMappingEntry) => (
                      <Button
                        variant="inline-link"
                        onClick={() => { removeEditMapping(item.id) }}
                      >
                        {t('create.form.attributeMapping.removeButton')}
                      </Button>
                    ),
                    width: 100,
                  },
                ]}
                items={editMapping}
                variant="embedded"
                empty={
                  <Box textAlign="center" color="text-body-secondary" padding="s">
                    {t('detail.attributeMapping.empty')}
                  </Box>
                }
              />
              <Button onClick={addEditMapping}>
                {t('create.form.attributeMapping.addButton')}
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Modal>
      )}
    </>
  )
}

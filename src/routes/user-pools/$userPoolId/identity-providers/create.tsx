import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Form from '@cloudscape-design/components/form'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Textarea from '@cloudscape-design/components/textarea'
import Button from '@cloudscape-design/components/button'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Container from '@cloudscape-design/components/container'
import Select from '@cloudscape-design/components/select'
import type { SelectProps } from '@cloudscape-design/components/select'
import Toggle from '@cloudscape-design/components/toggle'
import RadioGroup from '@cloudscape-design/components/radio-group'
import Table from '@cloudscape-design/components/table'
import Box from '@cloudscape-design/components/box'
import type { IdentityProviderTypeType } from '@aws-sdk/client-cognito-identity-provider'
import { useCreateIdentityProvider } from '../../../../api/hooks/useIdentityProviders'
import { useNotifications } from '../../../../hooks/useNotifications'

interface CreateSearch {
  type?: string
}

export const Route = createFileRoute('/user-pools/$userPoolId/identity-providers/create')({
  component: CreateIdentityProviderPage,
  validateSearch: (search: Record<string, unknown>): CreateSearch => {
    const result: CreateSearch = {}
    if (typeof search.type === 'string') {
      result.type = search.type
    }
    return result
  },
})

const PROVIDER_TYPE_OPTIONS: SelectProps.Option[] = [
  { value: 'SAML', label: 'SAML' },
  { value: 'OIDC', label: 'OIDC' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Google', label: 'Google' },
  { value: 'LoginWithAmazon', label: 'Login with Amazon' },
  { value: 'SignInWithApple', label: 'Sign in with Apple' },
]

const COGNITO_ATTRIBUTES = [
  'email', 'name', 'given_name', 'family_name', 'phone_number',
  'preferred_username', 'profile', 'picture', 'website', 'gender',
  'birthdate', 'zoneinfo', 'locale', 'address', 'nickname',
  'middle_name', 'updated_at',
]

const SOCIAL_TYPES = new Set(['Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'])

const VALID_PROVIDER_TYPES = new Set<string>([
  'SAML', 'OIDC', 'Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple',
])

function isIdentityProviderType(value: string): value is IdentityProviderTypeType {
  return VALID_PROVIDER_TYPES.has(value)
}

interface AttributeMapEntry {
  id: string
  cognitoAttribute: string
  providerAttribute: string
}

let entryId = 0
function nextEntryId(): string {
  entryId += 1
  return `entry-${String(entryId)}`
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

function CreateIdentityProviderPage() {
  const { t } = useTranslation('identityProviders')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const { type: searchType } = Route.useSearch()
  const { addNotification } = useNotifications()
  const createProvider = useCreateIdentityProvider()

  // Common fields
  const [providerName, setProviderName] = useState('')
  const initialType: SelectProps.Option | null = searchType
    ? PROVIDER_TYPE_OPTIONS.find((o) => o.value === searchType) ?? null
    : null
  const [selectedType, setSelectedType] = useState(initialType)
  const [idpIdentifiers, setIdpIdentifiers] = useState('')

  // SAML fields
  const [metadataSource, setMetadataSource] = useState<'url' | 'file'>('url')
  const [metadataUrl, setMetadataUrl] = useState('')
  const [metadataFile, setMetadataFile] = useState('')
  const [idpSignout, setIdpSignout] = useState(false)
  const [idpInit, setIdpInit] = useState(false)
  const [encryptedResponses, setEncryptedResponses] = useState(false)
  const [signingAlgorithm, setSigningAlgorithm] = useState('rsa-sha256')

  // OIDC fields
  const [oidcClientId, setOidcClientId] = useState('')
  const [oidcClientSecret, setOidcClientSecret] = useState('')
  const [oidcIssuer, setOidcIssuer] = useState('')
  const [oidcScopes, setOidcScopes] = useState('openid')
  const [oidcAttributesMethod, setOidcAttributesMethod] = useState('GET')

  // Social fields
  const [socialClientId, setSocialClientId] = useState('')
  const [socialClientSecret, setSocialClientSecret] = useState('')
  const [socialScopes, setSocialScopes] = useState('')

  // Attribute mapping
  const [attributeMap, setAttributeMap] = useState<AttributeMapEntry[]>([])

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const providerType = selectedType?.value ?? ''
  const isSocial = SOCIAL_TYPES.has(providerType)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (providerName.trim().length === 0) {
      newErrors.providerName = t('create.validation.providerNameRequired')
    }

    if (!selectedType) {
      newErrors.providerType = t('create.validation.providerTypeRequired')
    }

    if (providerType === 'SAML') {
      if (metadataSource === 'url' && metadataUrl.trim().length === 0) {
        newErrors.metadata = t('create.validation.metadataRequired')
      } else if (metadataSource === 'url' && metadataUrl.trim().length > 0 && !isValidUrl(metadataUrl.trim())) {
        newErrors.metadata = t('create.validation.invalidUrl')
      } else if (metadataSource === 'file' && metadataFile.trim().length === 0) {
        newErrors.metadata = t('create.validation.metadataRequired')
      }
    }

    if (providerType === 'OIDC') {
      if (oidcClientId.trim().length === 0) {
        newErrors.clientId = t('create.validation.clientIdRequired')
      }
      if (oidcIssuer.trim().length === 0) {
        newErrors.issuerUrl = t('create.validation.issuerUrlRequired')
      } else if (!isValidUrl(oidcIssuer.trim())) {
        newErrors.issuerUrl = t('create.validation.invalidUrl')
      }
    }

    if (isSocial) {
      if (socialClientId.trim().length === 0) {
        newErrors.clientId = t('create.validation.clientIdRequired')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildProviderDetails = (): Record<string, string> => {
    const details: Record<string, string> = {}

    if (providerType === 'SAML') {
      if (metadataSource === 'url') {
        details.MetadataURL = metadataUrl.trim()
      } else {
        details.MetadataFile = metadataFile.trim()
      }
      details.IDPSignout = String(idpSignout)
      details.IDPInit = String(idpInit)
      details.EncryptedResponses = String(encryptedResponses)
      details.RequestSigningAlgorithm = signingAlgorithm
    } else if (providerType === 'OIDC') {
      details.client_id = oidcClientId.trim()
      if (oidcClientSecret.trim().length > 0) {
        details.client_secret = oidcClientSecret.trim()
      }
      details.oidc_issuer = oidcIssuer.trim()
      details.authorize_scopes = oidcScopes.trim()
      details.attributes_request_method = oidcAttributesMethod
    } else if (isSocial) {
      details.client_id = socialClientId.trim()
      if (socialClientSecret.trim().length > 0) {
        details.client_secret = socialClientSecret.trim()
      }
      if (socialScopes.trim().length > 0) {
        details.authorize_scopes = socialScopes.trim()
      }
    }

    return details
  }

  const buildAttributeMapping = (): Record<string, string> => {
    const mapping: Record<string, string> = {}
    for (const entry of attributeMap) {
      if (entry.cognitoAttribute.length > 0 && entry.providerAttribute.length > 0) {
        mapping[entry.cognitoAttribute] = entry.providerAttribute
      }
    }
    return mapping
  }

  const handleSubmit = () => {
    if (!validate()) return

    const idpIds = idpIdentifiers.trim().length > 0
      ? idpIdentifiers.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : undefined

    const validatedType = isIdentityProviderType(providerType) ? providerType : undefined

    createProvider.mutate(
      {
        UserPoolId: userPoolId,
        ProviderName: providerName.trim(),
        ProviderType: validatedType,
        ProviderDetails: buildProviderDetails(),
        AttributeMapping: buildAttributeMapping(),
        IdpIdentifiers: idpIds,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `create-idp-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.createSuccess', { name: providerName.trim() }),
            dismissible: true,
          })
          void navigate({
            to: '/user-pools/$userPoolId/identity-providers/$providerName',
            params: { userPoolId, providerName: providerName.trim() },
          })
        },
        onError: () => {
          addNotification({
            id: `create-idp-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.createError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const addAttributeMapping = () => {
    setAttributeMap([...attributeMap, { id: nextEntryId(), cognitoAttribute: '', providerAttribute: '' }])
  }

  const removeAttributeMapping = (id: string) => {
    setAttributeMap(attributeMap.filter((e) => e.id !== id))
  }

  const updateAttributeMapping = (id: string, field: 'cognitoAttribute' | 'providerAttribute', value: string) => {
    setAttributeMap(attributeMap.map((e) => e.id === id ? { ...e, [field]: value } : e))
  }

  return (
    <Form
      header={<Header variant="h1">{t('create.title')}</Header>}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="link"
            onClick={() => {
              void navigate({
                to: '/user-pools/$userPoolId/identity-providers',
                params: { userPoolId },
              })
            }}
          >
            {t('create.form.cancelButton')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createProvider.isPending}
          >
            {t('create.form.createButton')}
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l">
        {/* Common settings */}
        <Container>
          <SpaceBetween size="l">
            <FormField
              label={t('create.form.providerType')}
              errorText={errors.providerType}
            >
              <Select
                selectedOption={selectedType}
                onChange={({ detail }) => {
                  setSelectedType(detail.selectedOption)
                  if (errors.providerType) {
                    setErrors({ ...errors, providerType: '' })
                  }
                }}
                options={PROVIDER_TYPE_OPTIONS}
                placeholder={t('create.selectTypePlaceholder')}
              />
            </FormField>
            <FormField
              label={t('create.form.providerName')}
              constraintText={t('create.form.providerNameConstraint')}
              errorText={errors.providerName}
            >
              <Input
                value={providerName}
                onChange={({ detail }) => {
                  setProviderName(detail.value)
                  if (errors.providerName) {
                    setErrors({ ...errors, providerName: '' })
                  }
                }}
                placeholder={t('create.form.providerNamePlaceholder')}
              />
            </FormField>
            <FormField
              label={t('create.form.idpIdentifiers')}
              constraintText={t('create.form.idpIdentifiersConstraint')}
            >
              <Input
                value={idpIdentifiers}
                onChange={({ detail }) => { setIdpIdentifiers(detail.value) }}
                placeholder={t('create.form.idpIdentifiersPlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Container>

        {/* SAML settings */}
        {providerType === 'SAML' && (
          <Container header={<Header variant="h2">{t('create.form.saml.title')}</Header>}>
            <SpaceBetween size="l">
              <FormField label={t('create.form.saml.metadataSource')}>
                <RadioGroup
                  value={metadataSource}
                  onChange={({ detail }) => {
                    if (detail.value === 'url' || detail.value === 'file') {
                      setMetadataSource(detail.value)
                    }
                  }}
                  items={[
                    { value: 'url', label: t('create.form.saml.metadataSourceUrl') },
                    { value: 'file', label: t('create.form.saml.metadataSourceFile') },
                  ]}
                />
              </FormField>
              {metadataSource === 'url' ? (
                <FormField
                  label={t('create.form.saml.metadataURL')}
                  errorText={errors.metadata}
                >
                  <Input
                    value={metadataUrl}
                    onChange={({ detail }) => {
                      setMetadataUrl(detail.value)
                      if (errors.metadata) {
                        setErrors({ ...errors, metadata: '' })
                      }
                    }}
                    placeholder={t('create.form.saml.metadataURLPlaceholder')}
                  />
                </FormField>
              ) : (
                <FormField
                  label={t('create.form.saml.metadataFile')}
                  errorText={errors.metadata}
                >
                  <Textarea
                    value={metadataFile}
                    onChange={({ detail }) => {
                      setMetadataFile(detail.value)
                      if (errors.metadata) {
                        setErrors({ ...errors, metadata: '' })
                      }
                    }}
                    placeholder={t('create.form.saml.metadataFilePlaceholder')}
                    rows={8}
                  />
                </FormField>
              )}
              <Toggle
                checked={idpSignout}
                onChange={({ detail }) => { setIdpSignout(detail.checked) }}
              >
                {t('create.form.saml.idpSignout')}
              </Toggle>
              <Toggle
                checked={idpInit}
                onChange={({ detail }) => { setIdpInit(detail.checked) }}
              >
                {t('create.form.saml.idpInit')}
              </Toggle>
              <Toggle
                checked={encryptedResponses}
                onChange={({ detail }) => { setEncryptedResponses(detail.checked) }}
              >
                {t('create.form.saml.encryptedResponses')}
              </Toggle>
              <FormField label={t('create.form.saml.requestSigningAlgorithm')}>
                <RadioGroup
                  value={signingAlgorithm}
                  onChange={({ detail }) => { setSigningAlgorithm(detail.value) }}
                  items={[
                    { value: 'rsa-sha256', label: t('create.form.saml.rsaSha256') },
                    { value: 'rsa-sha1', label: t('create.form.saml.rsaSha1') },
                  ]}
                />
              </FormField>
            </SpaceBetween>
          </Container>
        )}

        {/* OIDC settings */}
        {providerType === 'OIDC' && (
          <Container header={<Header variant="h2">{t('create.form.oidc.title')}</Header>}>
            <SpaceBetween size="l">
              <FormField
                label={t('create.form.oidc.clientId')}
                errorText={errors.clientId}
              >
                <Input
                  value={oidcClientId}
                  onChange={({ detail }) => {
                    setOidcClientId(detail.value)
                    if (errors.clientId) {
                      setErrors({ ...errors, clientId: '' })
                    }
                  }}
                  placeholder={t('create.form.oidc.clientIdPlaceholder')}
                />
              </FormField>
              <FormField label={t('create.form.oidc.clientSecret')}>
                <Input
                  value={oidcClientSecret}
                  onChange={({ detail }) => { setOidcClientSecret(detail.value) }}
                  placeholder={t('create.form.oidc.clientSecretPlaceholder')}
                  type="password"
                />
              </FormField>
              <FormField
                label={t('create.form.oidc.issuerUrl')}
                errorText={errors.issuerUrl}
              >
                <Input
                  value={oidcIssuer}
                  onChange={({ detail }) => {
                    setOidcIssuer(detail.value)
                    if (errors.issuerUrl) {
                      setErrors({ ...errors, issuerUrl: '' })
                    }
                  }}
                  placeholder={t('create.form.oidc.issuerUrlPlaceholder')}
                />
              </FormField>
              <FormField
                label={t('create.form.oidc.authorizeScopes')}
                constraintText={t('create.form.oidc.authorizeScopesConstraint')}
              >
                <Input
                  value={oidcScopes}
                  onChange={({ detail }) => { setOidcScopes(detail.value) }}
                  placeholder={t('create.form.oidc.authorizeScopesPlaceholder')}
                />
              </FormField>
              <FormField label={t('create.form.oidc.attributesRequestMethod')}>
                <RadioGroup
                  value={oidcAttributesMethod}
                  onChange={({ detail }) => { setOidcAttributesMethod(detail.value) }}
                  items={[
                    { value: 'GET', label: t('create.form.oidc.methodGet') },
                    { value: 'POST', label: t('create.form.oidc.methodPost') },
                  ]}
                />
              </FormField>
            </SpaceBetween>
          </Container>
        )}

        {/* Social settings */}
        {isSocial && (
          <Container header={<Header variant="h2">{t('create.form.social.title')}</Header>}>
            <SpaceBetween size="l">
              <FormField
                label={t('create.form.social.clientId')}
                errorText={errors.clientId}
              >
                <Input
                  value={socialClientId}
                  onChange={({ detail }) => {
                    setSocialClientId(detail.value)
                    if (errors.clientId) {
                      setErrors({ ...errors, clientId: '' })
                    }
                  }}
                  placeholder={t('create.form.social.clientIdPlaceholder')}
                />
              </FormField>
              <FormField label={t('create.form.social.clientSecret')}>
                <Input
                  value={socialClientSecret}
                  onChange={({ detail }) => { setSocialClientSecret(detail.value) }}
                  placeholder={t('create.form.social.clientSecretPlaceholder')}
                  type="password"
                />
              </FormField>
              <FormField label={t('create.form.social.authorizeScopes')}>
                <Input
                  value={socialScopes}
                  onChange={({ detail }) => { setSocialScopes(detail.value) }}
                  placeholder={t('create.form.social.authorizeScopesPlaceholder')}
                />
              </FormField>
            </SpaceBetween>
          </Container>
        )}

        {/* Attribute mapping */}
        {selectedType && (
          <Container header={<Header variant="h2">{t('create.form.attributeMapping.title')}</Header>}>
            <SpaceBetween size="m">
              <Box color="text-body-secondary">{t('create.form.attributeMapping.description')}</Box>
              <Table
                columnDefinitions={[
                  {
                    id: 'cognitoAttribute',
                    header: t('create.form.attributeMapping.cognitoAttribute'),
                    cell: (item: AttributeMapEntry) => (
                      <Select
                        selectedOption={item.cognitoAttribute ? { value: item.cognitoAttribute, label: item.cognitoAttribute } : null}
                        onChange={({ detail }) => {
                          updateAttributeMapping(item.id, 'cognitoAttribute', detail.selectedOption.value ?? '')
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
                    cell: (item: AttributeMapEntry) => (
                      <Input
                        value={item.providerAttribute}
                        onChange={({ detail }) => {
                          updateAttributeMapping(item.id, 'providerAttribute', detail.value)
                        }}
                        placeholder={t('create.form.attributeMapping.providerAttributePlaceholder')}
                      />
                    ),
                  },
                  {
                    id: 'actions',
                    header: '',
                    cell: (item: AttributeMapEntry) => (
                      <Button
                        variant="inline-link"
                        onClick={() => { removeAttributeMapping(item.id) }}
                      >
                        {t('create.form.attributeMapping.removeButton')}
                      </Button>
                    ),
                    width: 100,
                  },
                ]}
                items={attributeMap}
                variant="embedded"
                empty={
                  <Box textAlign="center" color="text-body-secondary" padding="s">
                    {t('detail.attributeMapping.empty')}
                  </Box>
                }
              />
              <Button onClick={addAttributeMapping}>
                {t('create.form.attributeMapping.addButton')}
              </Button>
            </SpaceBetween>
          </Container>
        )}
      </SpaceBetween>
    </Form>
  )
}

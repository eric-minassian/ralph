import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Form from '@cloudscape-design/components/form'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Button from '@cloudscape-design/components/button'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Header from '@cloudscape-design/components/header'
import Container from '@cloudscape-design/components/container'
import AttributeEditor from '@cloudscape-design/components/attribute-editor'
import { useCreateResourceServer } from '../../../../api/hooks/useResourceServers'
import { useNotifications } from '../../../../hooks/useNotifications'

export const Route = createFileRoute('/user-pools/$userPoolId/resource-servers/create')({
  component: CreateResourceServerPage,
})

interface ScopeItem {
  name: string
  description: string
}

function CreateResourceServerPage() {
  const { t } = useTranslation('resourceServers')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const { addNotification } = useNotifications()
  const createResourceServer = useCreateResourceServer()

  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [scopes, setScopes] = useState<ScopeItem[]>([])
  const [nameError, setNameError] = useState('')
  const [identifierError, setIdentifierError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    setSubmitted(true)
    setNameError('')
    setIdentifierError('')

    let hasError = false

    if (name.trim().length === 0) {
      setNameError(t('create.validation.nameRequired'))
      hasError = true
    }

    if (identifier.trim().length === 0) {
      setIdentifierError(t('create.validation.identifierRequired'))
      hasError = true
    }

    // Check scope-level validation
    for (const scope of scopes) {
      if (scope.name.trim().length === 0 || scope.description.trim().length === 0) {
        hasError = true
      }
    }

    // Check duplicate scope names
    const scopeNames = new Set<string>()
    for (const scope of scopes) {
      const trimmed = scope.name.trim()
      if (trimmed.length > 0 && scopeNames.has(trimmed)) {
        hasError = true
        break
      }
      scopeNames.add(trimmed)
    }

    if (hasError) return

    const scopeInputs = scopes.map((s) => ({
      ScopeName: s.name.trim(),
      ScopeDescription: s.description.trim(),
    }))

    createResourceServer.mutate(
      {
        UserPoolId: userPoolId,
        Identifier: identifier.trim(),
        Name: name.trim(),
        Scopes: scopeInputs,
      },
      {
        onSuccess: () => {
          addNotification({
            id: `create-rs-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.createSuccess', { name: name.trim() }),
            dismissible: true,
          })
          void navigate({
            to: '/user-pools/$userPoolId/resource-servers/$identifier',
            params: { userPoolId, identifier: encodeURIComponent(identifier.trim()) },
          })
        },
        onError: () => {
          addNotification({
            id: `create-rs-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.createError'),
            dismissible: true,
          })
        },
      },
    )
  }

  const getScopeNameError = (item: ScopeItem, index: number): string | undefined => {
    if (!submitted) return undefined
    if (item.name.trim().length === 0) return t('create.validation.scopeNameRequired')
    // Check duplicates
    const trimmed = item.name.trim()
    for (let i = 0; i < scopes.length; i++) {
      if (i !== index && scopes[i]?.name.trim() === trimmed) {
        return t('create.validation.scopeNameDuplicate')
      }
    }
    return undefined
  }

  const getScopeDescriptionError = (item: ScopeItem): string | undefined => {
    if (!submitted) return undefined
    if (item.description.trim().length === 0) return t('create.validation.scopeDescriptionRequired')
    return undefined
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
                to: '/user-pools/$userPoolId/resource-servers',
                params: { userPoolId },
              })
            }}
          >
            {t('create.form.cancelButton')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createResourceServer.isPending}
          >
            {t('create.form.createButton')}
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l">
        <Container>
          <SpaceBetween size="l">
            <FormField
              label={t('create.form.name')}
              constraintText={t('create.form.nameConstraint')}
              errorText={nameError}
            >
              <Input
                value={name}
                onChange={({ detail }) => {
                  setName(detail.value)
                  if (nameError.length > 0) setNameError('')
                }}
                placeholder={t('create.form.namePlaceholder')}
              />
            </FormField>
            <FormField
              label={t('create.form.identifier')}
              constraintText={t('create.form.identifierConstraint')}
              errorText={identifierError}
            >
              <Input
                value={identifier}
                onChange={({ detail }) => {
                  setIdentifier(detail.value)
                  if (identifierError.length > 0) setIdentifierError('')
                }}
                placeholder={t('create.form.identifierPlaceholder')}
              />
            </FormField>
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">{t('create.form.scopes')}</Header>}>
          <AttributeEditor
            onAddButtonClick={() => {
              setScopes([...scopes, { name: '', description: '' }])
            }}
            onRemoveButtonClick={({ detail }) => {
              const updated = [...scopes]
              updated.splice(detail.itemIndex, 1)
              setScopes(updated)
            }}
            items={scopes}
            addButtonText={t('create.form.addScope')}
            removeButtonText={t('common:remove')}
            empty={t('detail.scopes.empty')}
            definition={[
              {
                label: t('create.form.scopeName'),
                control: (item: ScopeItem, index: number) => (
                  <Input
                    value={item.name}
                    onChange={({ detail }) => {
                      const updated = [...scopes]
                      const existing = updated[index]
                      if (existing) {
                        updated[index] = { ...existing, name: detail.value }
                        setScopes(updated)
                      }
                    }}
                    placeholder={t('create.form.scopeNamePlaceholder')}
                  />
                ),
                errorText: (item: ScopeItem, index: number) => getScopeNameError(item, index),
              },
              {
                label: t('create.form.scopeDescription'),
                control: (item: ScopeItem, index: number) => (
                  <Input
                    value={item.description}
                    onChange={({ detail }) => {
                      const updated = [...scopes]
                      const existing = updated[index]
                      if (existing) {
                        updated[index] = { ...existing, description: detail.value }
                        setScopes(updated)
                      }
                    }}
                    placeholder={t('create.form.scopeDescriptionPlaceholder')}
                  />
                ),
                errorText: (item: ScopeItem) => getScopeDescriptionError(item),
              },
            ]}
          />
        </Container>
      </SpaceBetween>
    </Form>
  )
}

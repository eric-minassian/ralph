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
import { useCreateGroup } from '../../../../api/hooks/useGroups'
import { useNotifications } from '../../../../hooks/useNotifications'

export const Route = createFileRoute('/user-pools/$userPoolId/groups/create')({
  component: CreateGroupPage,
})

function CreateGroupPage() {
  const { t } = useTranslation('groups')
  const navigate = useNavigate()
  const { userPoolId } = Route.useParams()
  const { addNotification } = useNotifications()
  const createGroup = useCreateGroup()

  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [precedence, setPrecedence] = useState('')
  const [roleArn, setRoleArn] = useState('')
  const [groupNameError, setGroupNameError] = useState('')

  const handleSubmit = () => {
    setGroupNameError('')

    if (groupName.trim().length === 0) {
      setGroupNameError(t('create.validation.groupNameRequired'))
      return
    }

    const trimmedName = groupName.trim()
    const trimmedDescription = description.trim()
    const trimmedRoleArn = roleArn.trim()
    const parsedPrecedence = parseInt(precedence, 10)

    const mutationInput: Parameters<typeof createGroup.mutate>[0] = {
      UserPoolId: userPoolId,
      GroupName: trimmedName,
    }

    if (trimmedDescription.length > 0) {
      mutationInput.Description = trimmedDescription
    }

    if (!Number.isNaN(parsedPrecedence) && parsedPrecedence >= 0) {
      mutationInput.Precedence = parsedPrecedence
    }

    if (trimmedRoleArn.length > 0) {
      mutationInput.RoleArn = trimmedRoleArn
    }

    createGroup.mutate(
      mutationInput,
      {
        onSuccess: () => {
          addNotification({
            id: `create-group-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.createSuccess', { name: groupName.trim() }),
            dismissible: true,
          })
          void navigate({
            to: '/user-pools/$userPoolId/groups/$groupName',
            params: { userPoolId, groupName: groupName.trim() },
          })
        },
        onError: () => {
          addNotification({
            id: `create-group-err-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.createError'),
            dismissible: true,
          })
        },
      },
    )
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
                to: '/user-pools/$userPoolId/groups',
                params: { userPoolId },
              })
            }}
          >
            {t('create.form.cancelButton')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createGroup.isPending}
          >
            {t('create.form.createButton')}
          </Button>
        </SpaceBetween>
      }
    >
      <Container>
        <SpaceBetween size="l">
          <FormField
            label={t('create.form.groupName')}
            constraintText={t('create.form.groupNameConstraint')}
            errorText={groupNameError}
          >
            <Input
              value={groupName}
              onChange={({ detail }) => {
                setGroupName(detail.value)
                if (groupNameError.length > 0) setGroupNameError('')
              }}
              placeholder={t('create.form.groupNamePlaceholder')}
            />
          </FormField>
          <FormField label={t('create.form.description')}>
            <Textarea
              value={description}
              onChange={({ detail }) => { setDescription(detail.value) }}
              placeholder={t('create.form.descriptionPlaceholder')}
            />
          </FormField>
          <FormField
            label={t('create.form.precedence')}
            constraintText={t('create.form.precedenceConstraint')}
          >
            <Input
              value={precedence}
              onChange={({ detail }) => { setPrecedence(detail.value) }}
              placeholder={t('create.form.precedencePlaceholder')}
              inputMode="numeric"
            />
          </FormField>
          <FormField
            label={t('create.form.roleArn')}
            constraintText={t('create.form.roleArnConstraint')}
          >
            <Input
              value={roleArn}
              onChange={({ detail }) => { setRoleArn(detail.value) }}
              placeholder={t('create.form.roleArnPlaceholder')}
            />
          </FormField>
        </SpaceBetween>
      </Container>
    </Form>
  )
}

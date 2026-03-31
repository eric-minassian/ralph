import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@cloudscape-design/components/modal'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Select from '@cloudscape-design/components/select'
import type { SelectProps } from '@cloudscape-design/components/select'
import Toggle from '@cloudscape-design/components/toggle'
import type { AttributeDataType } from '@aws-sdk/client-cognito-identity-provider'
import { useAddCustomAttributes } from '../../../api/hooks/useUserPools'
import { useNotifications } from '../../../hooks/useNotifications'

function isAttributeDataType(value: unknown): value is AttributeDataType {
  return value === 'String' || value === 'Number' || value === 'DateTime' || value === 'Boolean'
}

function toAttributeDataType(value: string | undefined): AttributeDataType {
  if (isAttributeDataType(value)) return value
  return 'String'
}

interface AddCustomAttributeModalProps {
  userPoolId: string
  onDismiss: () => void
}

const DATA_TYPE_OPTIONS: SelectProps.Option[] = [
  { value: 'String', label: 'String' },
  { value: 'Number', label: 'Number' },
  { value: 'DateTime', label: 'DateTime' },
  { value: 'Boolean', label: 'Boolean' },
]

export function AddCustomAttributeModal({ userPoolId, onDismiss }: AddCustomAttributeModalProps) {
  const { t } = useTranslation('userPools')
  const addCustomAttributes = useAddCustomAttributes()
  const { addNotification } = useNotifications()

  const [attributeName, setAttributeName] = useState('')
  const [dataType, setDataType] = useState<SelectProps.Option>(
    { value: 'String', label: 'String' },
  )
  const [mutable, setMutable] = useState(true)
  const [nameError, setNameError] = useState('')

  const handleSave = () => {
    const trimmedName = attributeName.trim()
    if (trimmedName.length === 0) {
      setNameError(t('detail.customAttributes.nameRequired'))
      return
    }
    setNameError('')

    addCustomAttributes.mutate(
      {
        UserPoolId: userPoolId,
        CustomAttributes: [
          {
            Name: trimmedName,
            AttributeDataType: toAttributeDataType(dataType.value),
            Mutable: mutable,
          },
        ],
      },
      {
        onSuccess: () => {
          addNotification({
            id: `add-attr-${String(Date.now())}`,
            type: 'success',
            content: t('notifications.addAttributeSuccess'),
            dismissible: true,
          })
          onDismiss()
        },
        onError: () => {
          addNotification({
            id: `add-attr-error-${String(Date.now())}`,
            type: 'error',
            content: t('notifications.addAttributeError'),
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
      header={t('detail.customAttributes.addTitle')}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              {t('detail.customAttributes.cancelButton')}
            </Button>
            <Button variant="primary" onClick={handleSave} loading={addCustomAttributes.isPending}>
              {t('detail.customAttributes.saveButton')}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        <Box>{t('detail.customAttributes.addDescription')}</Box>
        <FormField
          label={t('detail.customAttributes.attributeName')}
          errorText={nameError.length > 0 ? nameError : undefined}
        >
          <Input
            value={attributeName}
            onChange={({ detail }) => {
              setAttributeName(detail.value)
              setNameError('')
            }}
            placeholder={t('detail.customAttributes.attributeNamePlaceholder')}
          />
        </FormField>
        <FormField label={t('detail.customAttributes.attributeDataType')}>
          <Select
            selectedOption={dataType}
            onChange={({ detail }) => { setDataType(detail.selectedOption) }}
            options={DATA_TYPE_OPTIONS}
          />
        </FormField>
        <FormField label={t('detail.customAttributes.attributeMutable')}>
          <Toggle
            checked={mutable}
            onChange={({ detail }) => { setMutable(detail.checked) }}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  )
}

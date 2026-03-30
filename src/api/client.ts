import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'

const region = import.meta.env.VITE_AWS_REGION ?? 'us-east-1'
const endpoint = import.meta.env.VITE_COGNITO_ENDPOINT

export const cognitoClient = new CognitoIdentityProviderClient({
  region,
  ...(endpoint ? { endpoint } : {}),
})

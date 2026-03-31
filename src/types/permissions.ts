/**
 * Union type of all 122 Cognito API operation names.
 * Used as the basis for the permission system — each permission maps 1:1
 * to a Cognito API operation.
 *
 * Source: @aws-sdk/client-cognito-identity-provider command exports.
 */
export type CognitoPermission =
  | 'AddCustomAttributes'
  | 'AddUserPoolClientSecret'
  | 'AdminAddUserToGroup'
  | 'AdminConfirmSignUp'
  | 'AdminCreateUser'
  | 'AdminDeleteUser'
  | 'AdminDeleteUserAttributes'
  | 'AdminDisableProviderForUser'
  | 'AdminDisableUser'
  | 'AdminEnableUser'
  | 'AdminForgetDevice'
  | 'AdminGetDevice'
  | 'AdminGetUser'
  | 'AdminInitiateAuth'
  | 'AdminLinkProviderForUser'
  | 'AdminListDevices'
  | 'AdminListGroupsForUser'
  | 'AdminListUserAuthEvents'
  | 'AdminRemoveUserFromGroup'
  | 'AdminResetUserPassword'
  | 'AdminRespondToAuthChallenge'
  | 'AdminSetUserMFAPreference'
  | 'AdminSetUserPassword'
  | 'AdminSetUserSettings'
  | 'AdminUpdateAuthEventFeedback'
  | 'AdminUpdateDeviceStatus'
  | 'AdminUpdateUserAttributes'
  | 'AdminUserGlobalSignOut'
  | 'AssociateSoftwareToken'
  | 'ChangePassword'
  | 'CompleteWebAuthnRegistration'
  | 'ConfirmDevice'
  | 'ConfirmForgotPassword'
  | 'ConfirmSignUp'
  | 'CreateGroup'
  | 'CreateIdentityProvider'
  | 'CreateManagedLoginBranding'
  | 'CreateResourceServer'
  | 'CreateTerms'
  | 'CreateUserImportJob'
  | 'CreateUserPool'
  | 'CreateUserPoolClient'
  | 'CreateUserPoolDomain'
  | 'DeleteGroup'
  | 'DeleteIdentityProvider'
  | 'DeleteManagedLoginBranding'
  | 'DeleteResourceServer'
  | 'DeleteTerms'
  | 'DeleteUser'
  | 'DeleteUserAttributes'
  | 'DeleteUserPool'
  | 'DeleteUserPoolClient'
  | 'DeleteUserPoolClientSecret'
  | 'DeleteUserPoolDomain'
  | 'DeleteWebAuthnCredential'
  | 'DescribeIdentityProvider'
  | 'DescribeManagedLoginBranding'
  | 'DescribeManagedLoginBrandingByClient'
  | 'DescribeResourceServer'
  | 'DescribeRiskConfiguration'
  | 'DescribeTerms'
  | 'DescribeUserImportJob'
  | 'DescribeUserPool'
  | 'DescribeUserPoolClient'
  | 'DescribeUserPoolDomain'
  | 'ForgetDevice'
  | 'ForgotPassword'
  | 'GetCSVHeader'
  | 'GetDevice'
  | 'GetGroup'
  | 'GetIdentityProviderByIdentifier'
  | 'GetLogDeliveryConfiguration'
  | 'GetSigningCertificate'
  | 'GetTokensFromRefreshToken'
  | 'GetUICustomization'
  | 'GetUser'
  | 'GetUserAttributeVerificationCode'
  | 'GetUserAuthFactors'
  | 'GetUserPoolMfaConfig'
  | 'GlobalSignOut'
  | 'InitiateAuth'
  | 'ListDevices'
  | 'ListGroups'
  | 'ListIdentityProviders'
  | 'ListResourceServers'
  | 'ListTagsForResource'
  | 'ListTerms'
  | 'ListUserImportJobs'
  | 'ListUserPoolClients'
  | 'ListUserPoolClientSecrets'
  | 'ListUserPools'
  | 'ListUsers'
  | 'ListUsersInGroup'
  | 'ListWebAuthnCredentials'
  | 'ResendConfirmationCode'
  | 'RespondToAuthChallenge'
  | 'RevokeToken'
  | 'SetLogDeliveryConfiguration'
  | 'SetRiskConfiguration'
  | 'SetUICustomization'
  | 'SetUserMFAPreference'
  | 'SetUserPoolMfaConfig'
  | 'SetUserSettings'
  | 'SignUp'
  | 'StartUserImportJob'
  | 'StartWebAuthnRegistration'
  | 'StopUserImportJob'
  | 'TagResource'
  | 'UntagResource'
  | 'UpdateAuthEventFeedback'
  | 'UpdateDeviceStatus'
  | 'UpdateGroup'
  | 'UpdateIdentityProvider'
  | 'UpdateManagedLoginBranding'
  | 'UpdateResourceServer'
  | 'UpdateTerms'
  | 'UpdateUserAttributes'
  | 'UpdateUserPool'
  | 'UpdateUserPoolClient'
  | 'UpdateUserPoolDomain'
  | 'VerifySoftwareToken'
  | 'VerifyUserAttribute'

/** Array of all 122 Cognito permissions, useful for granting full access. */
export const ALL_COGNITO_PERMISSIONS: readonly CognitoPermission[] = [
  'AddCustomAttributes',
  'AddUserPoolClientSecret',
  'AdminAddUserToGroup',
  'AdminConfirmSignUp',
  'AdminCreateUser',
  'AdminDeleteUser',
  'AdminDeleteUserAttributes',
  'AdminDisableProviderForUser',
  'AdminDisableUser',
  'AdminEnableUser',
  'AdminForgetDevice',
  'AdminGetDevice',
  'AdminGetUser',
  'AdminInitiateAuth',
  'AdminLinkProviderForUser',
  'AdminListDevices',
  'AdminListGroupsForUser',
  'AdminListUserAuthEvents',
  'AdminRemoveUserFromGroup',
  'AdminResetUserPassword',
  'AdminRespondToAuthChallenge',
  'AdminSetUserMFAPreference',
  'AdminSetUserPassword',
  'AdminSetUserSettings',
  'AdminUpdateAuthEventFeedback',
  'AdminUpdateDeviceStatus',
  'AdminUpdateUserAttributes',
  'AdminUserGlobalSignOut',
  'AssociateSoftwareToken',
  'ChangePassword',
  'CompleteWebAuthnRegistration',
  'ConfirmDevice',
  'ConfirmForgotPassword',
  'ConfirmSignUp',
  'CreateGroup',
  'CreateIdentityProvider',
  'CreateManagedLoginBranding',
  'CreateResourceServer',
  'CreateTerms',
  'CreateUserImportJob',
  'CreateUserPool',
  'CreateUserPoolClient',
  'CreateUserPoolDomain',
  'DeleteGroup',
  'DeleteIdentityProvider',
  'DeleteManagedLoginBranding',
  'DeleteResourceServer',
  'DeleteTerms',
  'DeleteUser',
  'DeleteUserAttributes',
  'DeleteUserPool',
  'DeleteUserPoolClient',
  'DeleteUserPoolClientSecret',
  'DeleteUserPoolDomain',
  'DeleteWebAuthnCredential',
  'DescribeIdentityProvider',
  'DescribeManagedLoginBranding',
  'DescribeManagedLoginBrandingByClient',
  'DescribeResourceServer',
  'DescribeRiskConfiguration',
  'DescribeTerms',
  'DescribeUserImportJob',
  'DescribeUserPool',
  'DescribeUserPoolClient',
  'DescribeUserPoolDomain',
  'ForgetDevice',
  'ForgotPassword',
  'GetCSVHeader',
  'GetDevice',
  'GetGroup',
  'GetIdentityProviderByIdentifier',
  'GetLogDeliveryConfiguration',
  'GetSigningCertificate',
  'GetTokensFromRefreshToken',
  'GetUICustomization',
  'GetUser',
  'GetUserAttributeVerificationCode',
  'GetUserAuthFactors',
  'GetUserPoolMfaConfig',
  'GlobalSignOut',
  'InitiateAuth',
  'ListDevices',
  'ListGroups',
  'ListIdentityProviders',
  'ListResourceServers',
  'ListTagsForResource',
  'ListTerms',
  'ListUserImportJobs',
  'ListUserPoolClients',
  'ListUserPoolClientSecrets',
  'ListUserPools',
  'ListUsers',
  'ListUsersInGroup',
  'ListWebAuthnCredentials',
  'ResendConfirmationCode',
  'RespondToAuthChallenge',
  'RevokeToken',
  'SetLogDeliveryConfiguration',
  'SetRiskConfiguration',
  'SetUICustomization',
  'SetUserMFAPreference',
  'SetUserPoolMfaConfig',
  'SetUserSettings',
  'SignUp',
  'StartUserImportJob',
  'StartWebAuthnRegistration',
  'StopUserImportJob',
  'TagResource',
  'UntagResource',
  'UpdateAuthEventFeedback',
  'UpdateDeviceStatus',
  'UpdateGroup',
  'UpdateIdentityProvider',
  'UpdateManagedLoginBranding',
  'UpdateResourceServer',
  'UpdateTerms',
  'UpdateUserAttributes',
  'UpdateUserPool',
  'UpdateUserPoolClient',
  'UpdateUserPoolDomain',
  'VerifySoftwareToken',
  'VerifyUserAttribute',
] as const

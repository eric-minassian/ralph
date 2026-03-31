import type { DeviceType, WebAuthnCredentialDescription } from '@aws-sdk/client-cognito-identity-provider'

let deviceCounter = 0

/**
 * Creates a realistic mock DeviceType.
 */
export function createMockDevice(overrides: Partial<DeviceType> = {}): DeviceType {
  deviceCounter += 1
  const now = new Date()
  const deviceKey = overrides.DeviceKey ?? `us-east-1_device${String(deviceCounter).padStart(3, '0')}`
  return {
    DeviceKey: deviceKey,
    DeviceAttributes: overrides.DeviceAttributes ?? [
      { Name: 'device_name', Value: `Test Device ${String(deviceCounter)}` },
      { Name: 'device_status', Value: 'remembered' },
      { Name: 'last_ip_used', Value: '203.0.113.1' },
    ],
    DeviceCreateDate: overrides.DeviceCreateDate ?? now,
    DeviceLastModifiedDate: overrides.DeviceLastModifiedDate ?? now,
    DeviceLastAuthenticatedDate: overrides.DeviceLastAuthenticatedDate ?? now,
  }
}

let credCounter = 0

/**
 * Creates a realistic mock WebAuthnCredentialDescription.
 */
export function createMockWebAuthnCredential(
  overrides: Partial<WebAuthnCredentialDescription> = {},
): WebAuthnCredentialDescription {
  credCounter += 1
  return {
    CredentialId: overrides.CredentialId ?? crypto.randomUUID(),
    FriendlyCredentialName: overrides.FriendlyCredentialName ?? `Credential ${String(credCounter)}`,
    RelyingPartyId: overrides.RelyingPartyId ?? 'cognito.example.com',
    AuthenticatorAttachment: overrides.AuthenticatorAttachment ?? 'platform',
    AuthenticatorTransports: overrides.AuthenticatorTransports ?? ['internal'],
    CreatedAt: overrides.CreatedAt ?? new Date(),
  }
}

export function resetDeviceCounter(): void {
  deviceCounter = 0
}

export function resetCredentialCounter(): void {
  credCounter = 0
}

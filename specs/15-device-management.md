# Spec: Device Management

## Overview

UI for viewing and managing remembered devices for users in a user pool.

## APIs Covered

- `AdminGetDevice`
- `AdminListDevices`
- `AdminForgetDevice`
- `AdminUpdateDeviceStatus`

## User Stories

- As an admin, I want to see all remembered devices for a specific user.
- As an admin, I want to forget (remove) a device.
- As an admin, I want to update a device's remembered status.

## Acceptance Criteria

- [ ] Device table within user detail page (Devices tab)
- [ ] Columns: Device Key, Device Name, Last IP, Last Authenticated, Created, Remembered Status
- [ ] Forget device action with confirmation modal
- [ ] Update device status: toggle between remembered/not-remembered
- [ ] Device detail view showing all device attributes
- [ ] Unit tests: table rendering, action modals
- [ ] Integration tests: list, forget, update status with MSW

## Technical Constraints

- Devices are displayed within the user detail page, not as a standalone route
- Device key is the unique identifier
- Forgetting a device is irreversible — confirmation must be clear

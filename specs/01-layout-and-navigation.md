# Spec: Layout and Navigation

## Overview

Application shell using Cloudscape AppLayout with side navigation, top navigation, breadcrumbs, and flash notifications. Navigation structure mirrors the Cognito API domains.

## User Stories

- As an admin, I want a clear navigation sidebar so I can quickly access any Cognito resource type.
- As an admin, I want breadcrumbs so I know where I am in the application hierarchy.
- As an admin, I want flash notifications so I see success/error feedback for API operations.

## Acceptance Criteria

- [ ] Cloudscape `AppLayout` used as the root layout component
- [ ] `TopNavigation` with app title "Cognito Manager", user menu (profile, sign out)
- [ ] `SideNavigation` with sections for each API domain:
  - User Pools (list, create)
  - Users (list, create, import)
  - Groups (list, create)
  - App Clients (list, create)
  - Identity Providers (list, create)
  - Domains
  - Resource Servers (list, create)
  - Branding
  - Security (Risk Configuration, Auth Events)
  - Terms of Service
- [ ] Navigation items are dynamically shown/hidden based on user permissions (see permission-system spec)
- [ ] `BreadcrumbGroup` auto-generated from current route
- [ ] `Flashbar` component for global notifications, managed via a notification store/context
- [ ] Help panel integration via `AppLayout` tools slot
- [ ] All navigation labels are i18n keys (no hardcoded strings)
- [ ] Side navigation highlights current active section
- [ ] Responsive: navigation collapses on smaller viewports
- [ ] Unit tests for navigation rendering based on different permission sets
- [ ] Unit tests for breadcrumb generation from routes

## Technical Constraints

- Use Cloudscape `AppLayout`, `SideNavigation`, `TopNavigation`, `BreadcrumbGroup`, `Flashbar` components
- Navigation structure must be data-driven (defined as a config array, not hardcoded JSX)
- Notification system must support: success, error, info, warning, in-progress types
- All text must use i18n translation keys

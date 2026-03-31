import { useState } from 'react'
import AppLayout from '@cloudscape-design/components/app-layout'
import Flashbar from '@cloudscape-design/components/flashbar'
import { Outlet } from '@tanstack/react-router'
import { TopNav } from './TopNav'
import { SideNav } from './SideNav'
import { Breadcrumbs } from './Breadcrumbs'
import { useNotifications } from '../../hooks/useNotifications'

export function AppShell() {
  const { notifications } = useNotifications()
  const [navigationOpen, setNavigationOpen] = useState(true)

  return (
    <>
      <TopNav />
      <AppLayout
        navigation={<SideNav />}
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => {
          setNavigationOpen(detail.open)
        }}
        breadcrumbs={<Breadcrumbs />}
        notifications={<Flashbar items={[...notifications]} />}
        toolsHide
        content={<Outlet />}
      />
    </>
  )
}

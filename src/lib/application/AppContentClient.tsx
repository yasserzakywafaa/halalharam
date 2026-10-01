'use client'

import './App.scss'

import type { ReactNode } from 'react'
import PageContainer from '../../components/PageContainer/PageContainer.tsx'

interface AppContentClientProps {
  children: ReactNode
}

/** Global styles plus the page frame (bar, lookup, footer) shared by every route. */
const AppContentClient = ({ children }: AppContentClientProps) => {
  return <PageContainer>{children}</PageContainer>
}

export default AppContentClient

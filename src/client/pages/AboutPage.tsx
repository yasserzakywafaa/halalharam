'use client'

import { useMemo } from 'react'
import { Link, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import seedFile from '../../../data/seed-rulings.json'
import { listCitedHomes } from '../../../lib/cited-homes.ts'
import { ProseBody, ProsePage, ProseSection } from '../components/ProsePage.tsx'

export default function AboutPage() {
  const { t } = useTranslation()
  const homes = useMemo(() => listCitedHomes(seedFile.items), [])

  return (
    <ProsePage title={t('about.title')} lead={t('about.lead')}>
      <ProseSection title={t('how.title')}>
        <ProseBody>{t('how.body')}</ProseBody>
      </ProseSection>

      <ProseSection title={t('about.sourcesTitle')}>
        <Typography sx={{ mb: 1.5, fontSize: 16.5, lineHeight: 1.7, color: 'text.secondary' }}>
          {t('about.sourcesLead')}
        </Typography>
        <Stack spacing={0}>
          {homes.map((home) => (
            <Stack
              key={home.href}
              spacing={0.35}
              sx={{ py: 1.35, borderTop: '1px solid', borderColor: 'divider' }}
            >
              {home.authorities.map((authority) => (
                <Typography key={authority} sx={{ fontWeight: 650, fontSize: 15.5 }}>
                  {authority}
                </Typography>
              ))}
              <Link
                href={home.href}
                target="_blank"
                rel="noreferrer"
                sx={{ fontSize: 14, wordBreak: 'break-all', width: 'fit-content' }}
              >
                {home.href}
              </Link>
            </Stack>
          ))}
        </Stack>
      </ProseSection>

      <ProseSection title={t('about.notTitle')}>
        <ProseBody>{t('about.notBody')}</ProseBody>
      </ProseSection>
    </ProsePage>
  )
}

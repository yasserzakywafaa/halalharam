'use client'

import { useTranslation } from 'react-i18next'
import { ProseBody, ProsePage, ProseSection } from '../components/ProsePage.jsx'

export default function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <ProsePage title={t('privacy.title')} lead={t('privacy.lead')}>
      <ProseSection title={t('privacy.localTitle')}>
        <ProseBody>{t('privacy.localBody')}</ProseBody>
      </ProseSection>
      <ProseSection title={t('privacy.lookupTitle')}>
        <ProseBody>{t('privacy.lookupBody')}</ProseBody>
      </ProseSection>
      <ProseSection title={t('privacy.catalogTitle')}>
        <ProseBody>{t('privacy.catalogBody')}</ProseBody>
      </ProseSection>
      <ProseSection title={t('privacy.adsTitle')}>
        <ProseBody>{t('privacy.adsBody')}</ProseBody>
      </ProseSection>
      <ProseSection title={t('privacy.fatwaTitle')}>
        <ProseBody>{t('privacy.fatwaBody')}</ProseBody>
      </ProseSection>
    </ProsePage>
  )
}

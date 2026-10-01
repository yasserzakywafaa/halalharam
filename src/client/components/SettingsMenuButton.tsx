import { useState, type MouseEvent, type ReactNode } from 'react'
import type { Locale } from '../../../lib/types.ts'
import { Box, Typography } from '@mui/material'
import { RefreshOutlined, Settings } from '@mui/icons-material'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@yasserzakywafaa/client-core/web/i18n'
import { ThemeSwitcher } from '@yasserzakywafaa/client-core/web'
import { useColorMode, useLocale } from '../providers.tsx'

/**
 * Same gear menu as aodit / talepod / the boilerplate SettingsMenuButton.
 * Theme and language rows, including language flags, come from client-core.
 * This app has no account store, so language changes write languagePreference.
 */
export default function SettingsMenuButton({ children }: { children?: ReactNode }) {
  const { t } = useTranslation('common')
  const { themePreference, setThemePreference } = useColorMode()
  const { setLanguage } = useLocale()
  const muiTheme = useTheme()
  const [element, setElement] = useState<HTMLElement | null>(null)
  const isOpen = Boolean(element)
  const dark = muiTheme.palette.mode === 'dark'
  const accentColor = muiTheme.palette.primary.main
  const menuFg = dark ? '#FFFFFF' : '#111729'
  const iconFg = dark ? '#E4ECF8' : accentColor

  const buttonHoverStylePrimary = {
    '&:hover': {
      bgcolor: muiTheme.palette.action.hover,
      '& .MuiTypography-root': { color: menuFg },
      '& .MuiSvgIcon-root': { color: iconFg },
    },
  }

  const handleMenuButtonClick = (event: MouseEvent<HTMLElement>) => {
    setElement(event.currentTarget)
  }

  const handleCloseMenu = () => setElement(null)

  const handleOnRefreshClick = () => {
    window.location.reload()
  }

  const handleOnLanguageChange = (lang: string) => {
    setLanguage(lang as Locale)
  }

  return (
    <>
      <Box
        id="settings-button"
        aria-label={t('settings.menu')}
        aria-haspopup="true"
        aria-expanded={isOpen ? 'true' : undefined}
        aria-controls={isOpen ? 'settings-menu' : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={handleMenuButtonClick}
      >
        <Settings fontSize="medium" color="primary" />
        {children}
      </Box>

      <Menu
        open={isOpen}
        anchorEl={element}
        disableScrollLock
        id="settings-menu"
        elevation={0}
        slotProps={{
          list: {
            'aria-labelledby': 'settings-button',
            sx: { py: 1.25, bgcolor: 'transparent' },
          },
          paper: {
            sx: {
              mt: 1,
              minWidth: 300,
              color: menuFg,
              bgcolor: dark ? '#121212' : '#FFFFFF',
              backgroundImage: 'none',
              border: '1px solid #89AEDB',
              borderRadius: '12px',
              boxShadow: 'none',
              overflow: 'hidden',
            },
          },
        }}
        variant="menu"
        onClose={handleCloseMenu}
      >
        <ThemeSwitcher
          value={themePreference}
          onChange={setThemePreference}
          accentColor={accentColor}
        />

        <LanguageSwitcher
          styles={{ ...buttonHoverStylePrimary }}
          onLanguageChange={handleOnLanguageChange}
        />

        <MenuItem sx={{ ...buttonHoverStylePrimary, color: menuFg, py: 1.25 }} onClick={handleOnRefreshClick}>
          <RefreshOutlined fontSize="medium" sx={{ mr: 1.5, color: iconFg }} />
          <Typography variant="body1" sx={{ color: menuFg }}>
            {t('settings.refreshApp')}
          </Typography>
        </MenuItem>
      </Menu>
    </>
  )
}

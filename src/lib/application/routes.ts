export const routes = {
  main: `/`,
  about: `/about`,
  privacyPolicy: `/privacy-policy`,
  api: {
    verdict: `/api/v1/verdict`,
    health: `/api/v1/health`,
  },
} as const

export default routes

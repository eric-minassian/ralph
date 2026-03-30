/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS: string | undefined
  readonly VITE_AWS_REGION: string | undefined
  readonly VITE_COGNITO_ENDPOINT: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

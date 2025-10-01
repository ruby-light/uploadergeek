/// <reference types="vite/client" />

interface ViteTypeOptions {
    strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
    readonly VITE_APP_BACKEND_CANISTER_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig, loadEnv} from 'vite';
import checker from 'vite-plugin-checker';
import environment from 'vite-plugin-environment';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

const localReplicaPort = 8080;
const basePathToRoot = './..';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = `${basePathToRoot}/release/frontend`;

export default defineConfig(({mode}) => {
    const isDev = mode == 'development';
    const projectRootFolderPath = path.resolve(__dirname, basePathToRoot);
    const env = loadEnv(mode, projectRootFolderPath, ['VITE_']);

    const envVars = {
        BACKEND_CANISTER_ID: env.VITE_APP_BACKEND_CANISTER_ID
    };
    if (envVars.BACKEND_CANISTER_ID == undefined) {
        throw new Error(`Vite[${canisterName}] VITE_APP_BACKEND_CANISTER_ID is not defined in ".env*" file.`);
    }
    if (env.VITE_APP_INTERNET_IDENTITY_URL != undefined) {
        envVars['INTERNET_IDENTITY_URL'] = env.VITE_APP_INTERNET_IDENTITY_URL;
    }

    return {
        logLevel: 'info',
        build: {
            target: 'es2020',
            outDir,
            emptyOutDir: true,
            sourcemap: !isDev,
            assetsInlineLimit: 1024 * 4, //4kb
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        }
                    }
                }
            }
        },
        esbuild: {
            minify: !isDev,
            legalComments: 'none',
            drop: isDev ? [] : ['debugger']
        },
        envDir: `${basePathToRoot}`,
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis'
                }
            }
        },
        server: isDev
            ? {
                  proxy: {
                      '/api': {
                          target: `http://127.0.0.1:${localReplicaPort}`,
                          changeOrigin: true
                      },
                      '/get_canister_id': {
                          target: `http://127.0.0.1:${localReplicaPort}`,
                          changeOrigin: true
                      }
                  }
              }
            : undefined,
        plugins: [react(), nodePolyfills(), checker({typescript: true}), environment(envVars)],
        resolve: {
            alias: [
                {
                    find: `frontend`,
                    replacement: path.resolve(projectRootFolderPath, `frontend`)
                },
                {
                    find: 'src/declarations',
                    replacement: path.resolve(`${basePathToRoot}/src/declarations`)
                }
            ]
        }
    };
});

---
trigger: always_on
---

# No hardcodear credenciales / No hardcoded credentials / Nessuna credenziale nel codice

- **ES:** Nunca poner credenciales, tokens, API keys, URLs privadas ni secretos directamente en archivos. Usar `src/environments/environment.ts` (con git-ignore para `environment.local.ts` si aplica).
- **EN:** Never hardcode credentials, tokens, API keys, private URLs or secrets in any file. Use `src/environments/environment.ts`.
- **IT:** Mai inserire credenziali, token, API key, URL privati o segreti nei file. Usa `src/environments/environment.ts`.

Importar con alias o ruta canónica: `import { environment } from '@environments/environment'`.

#!/usr/bin/env node

const cp = require('child_process')

const options = { shell: true, stdio: 'inherit' }

cp.execFileSync(
  'pnpm',
  ['--filter', 'core', '--filter', 'scripts', 'build'],
  options,
)
cp.execFileSync('node', ['./packages/scripts/out/seed/seed'], {
  ...options,
  env: {
    PGURI: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    SUPABASE_SERVICE_ROLE_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  },
})
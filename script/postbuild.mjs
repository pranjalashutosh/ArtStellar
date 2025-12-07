#!/usr/bin/env node

/**
 * Post-build script that runs database migrations only if DATABASE_URL is set
 * This allows builds to succeed in development without a database
 */

import { spawn } from 'child_process';

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL found, running migrations...');
  
  const migrate = spawn('npm', ['run', 'db:push'], {
    stdio: 'inherit',
    shell: true
  });

  migrate.on('close', (code) => {
    if (code !== 0) {
      console.error(`Migration failed with code ${code}`);
      process.exit(code);
    }
    console.log('Migrations completed successfully');
  });
} else {
  console.log('No DATABASE_URL found, skipping migrations (OK for development)');
  process.exit(0);
}


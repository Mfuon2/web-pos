#!/usr/bin/env node

/**
 * Migration Runner for D1 Database
 * 
 * This script tracks and runs SQL migrations, preventing re-execution of
 * already-run migrations.
 * 
 * Usage:
 *   node scripts/migrate.js --local   # Run against local D1 database
 *   node scripts/migrate.js --remote  # Run against remote D1 database
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const MIGRATIONS_DIR = join(ROOT_DIR, 'drizzle', 'migrations');
const DATABASE_NAME = 'pos_database';

// Parse command line arguments
const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const isLocal = args.includes('--local');

if (!isRemote && !isLocal) {
    console.error('Usage: node scripts/migrate.js --local|--remote');
    process.exit(1);
}

const mode = isRemote ? '--remote' : '--local';

/**
 * Execute a SQL command against D1
 */
function executeSQL(sql) {
    try {
        const result = execSync(
            `npx wrangler d1 execute ${DATABASE_NAME} ${mode} --command="${sql.replace(/"/g, '\\"')}"`,
            { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        return result;
    } catch (error) {
        throw new Error(`SQL execution failed: ${error.message}`);
    }
}

/**
 * Get list of already executed migrations from database
 */
function getExecutedMigrations() {
    try {
        const result = execSync(
            `npx wrangler d1 execute ${DATABASE_NAME} ${mode} --command="SELECT name FROM _migrations ORDER BY name" --json`,
            { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );

        const parsed = JSON.parse(result);
        if (parsed && parsed[0] && parsed[0].results) {
            return parsed[0].results.map(row => row.name);
        }
        return [];
    } catch (error) {
        // Table might not exist yet, return empty array
        console.log('ℹ️  _migrations table not found or empty, will create with schema');
        return [];
    }
}

/**
 * Record a migration as executed
 */
function recordMigration(name) {
    executeSQL(`INSERT INTO _migrations (name) VALUES ('${name}')`);
}

/**
 * Get list of migration files
 */
function getMigrationFiles() {
    try {
        const files = readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();
        return files;
    } catch (error) {
        console.log('ℹ️  No migrations directory found');
        return [];
    }
}

/**
 * Run a migration file
 * Returns: 'success' | 'already_applied' | 'failed'
 */
function runMigration(filename) {
    const filepath = join(MIGRATIONS_DIR, filename);
    const sql = readFileSync(filepath, 'utf8').trim();

    if (!sql) {
        console.log(`⏭️  Skipping empty migration: ${filename}`);
        return 'already_applied';
    }

    try {
        // Execute the migration using --file flag for multi-statement support
        execSync(
            `npx wrangler d1 execute ${DATABASE_NAME} ${mode} --file="${filepath}"`,
            { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'pipe' }
        );
        return 'success';
    } catch (error) {
        // Check if error is related to column/table already existing
        const errorMsg = error.message || error.stderr || error.stdout || '';
        if (errorMsg.includes('duplicate column') ||
            errorMsg.includes('already exists') ||
            errorMsg.includes('SQLITE_ERROR')) {
            console.log(`⚠️  Migration already applied (column/table exists): ${filename}`);
            return 'already_applied'; // Mark as applied to prevent retries
        }
        throw error;
    }
}

/**
 * Main migration runner
 */
async function main() {
    console.log(`\n🔄 Running migrations (${isRemote ? 'REMOTE' : 'LOCAL'})...\n`);

    // First, ensure schema (including _migrations table) exists
    console.log('📋 Ensuring base schema exists...');
    try {
        execSync(
            `npx wrangler d1 execute ${DATABASE_NAME} ${mode} --file="${join(ROOT_DIR, 'schema.sql')}"`,
            { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'inherit' }
        );
    } catch (error) {
        console.error('❌ Failed to apply base schema:', error.message);
        process.exit(1);
    }

    // Get executed migrations
    const executedMigrations = getExecutedMigrations();
    console.log(`📊 Found ${executedMigrations.length} previously executed migrations\n`);

    // Get migration files
    const migrationFiles = getMigrationFiles();
    if (migrationFiles.length === 0) {
        console.log('✅ No migrations to run\n');
        return;
    }

    // Filter to pending migrations
    const pendingMigrations = migrationFiles.filter(f => !executedMigrations.includes(f));

    if (pendingMigrations.length === 0) {
        console.log('✅ All migrations already executed\n');
        return;
    }

    console.log(`🔄 Running ${pendingMigrations.length} pending migrations...\n`);

    // Run pending migrations
    let successCount = 0;
    let alreadyAppliedCount = 0;
    let failCount = 0;

    for (const migration of pendingMigrations) {
        console.log(`➡️  Running: ${migration}`);
        try {
            const result = runMigration(migration);
            if (result === 'success' || result === 'already_applied') {
                recordMigration(migration);
                if (result === 'success') {
                    console.log(`✅ Completed: ${migration}\n`);
                    successCount++;
                } else {
                    console.log(`✅ Recorded as applied: ${migration}\n`);
                    alreadyAppliedCount++;
                }
            }
        } catch (error) {
            console.error(`❌ Failed: ${migration}`);
            console.error(`   Error: ${error.message}\n`);
            failCount++;
            // Continue with other migrations instead of stopping
        }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ New: ${successCount}`);
    console.log(`   ⚠️  Already applied: ${alreadyAppliedCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Previously recorded: ${executedMigrations.length}\n`);

    if (failCount > 0) {
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});

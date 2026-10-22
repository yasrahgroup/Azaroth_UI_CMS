import type { PoolClient } from 'pg';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'baseline-schema',
    sql: `
      CREATE TABLE IF NOT EXISTS ath_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(32) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_site_settings (
        id VARCHAR(32) PRIMARY KEY,
        data JSONB NOT NULL,
        is_draft BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_products (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        description TEXT NOT NULL,
        hero_image TEXT NOT NULL,
        hero_image_alt TEXT NOT NULL,
        gallery_images JSONB NOT NULL,
        features JSONB NOT NULL,
        benefits JSONB NOT NULL,
        use_cases JSONB NOT NULL,
        cta_label VARCHAR(255) NOT NULL,
        cta_destination VARCHAR(255) NOT NULL,
        meta_title VARCHAR(255) NOT NULL,
        meta_description TEXT NOT NULL,
        is_published BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_pages (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        meta_description TEXT NOT NULL,
        sections JSONB NOT NULL,
        is_published BOOLEAN DEFAULT TRUE,
        published_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_media (
        id VARCHAR(64) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(128) NOT NULL,
        size_bytes BIGINT NOT NULL,
        url TEXT NOT NULL,
        alt_text TEXT NOT NULL,
        media_type VARCHAR(32) NOT NULL,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_enquiries (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        product_interest VARCHAR(255),
        status VARCHAR(32) DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_leads (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(64),
        company VARCHAR(255),
        business_type VARCHAR(255),
        product_interest VARCHAR(255),
        requirements TEXT NOT NULL,
        status VARCHAR(32) DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ath_revisions (
        id VARCHAR(64) PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        note TEXT NOT NULL,
        data JSONB NOT NULL
      );

      ALTER TABLE ath_products ADD COLUMN IF NOT EXISTS stage VARCHAR(64) DEFAULT 'Ready for Deployment';
    `,
  },
  {
    version: 2,
    name: 'media-uploaded-at-index',
    sql: `
      CREATE INDEX IF NOT EXISTS ath_media_uploaded_at_idx
      ON ath_media (uploaded_at DESC);
    `,
  },
  {
    version: 3,
    name: 'durable-page-drafts',
    sql: `
      CREATE TABLE IF NOT EXISTS ath_page_drafts (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        meta_description TEXT NOT NULL,
        sections JSONB NOT NULL,
        is_published BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  {
    version: 4,
    name: 'preinstalled-addon-registry',
    sql: `
      CREATE TABLE IF NOT EXISTS ath_addons (
        id VARCHAR(128) PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
];

export async function runMigrations(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ath_schema_migrations (
      version INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const appliedResult = await client.query<{ version: number }>(
    'SELECT version FROM ath_schema_migrations ORDER BY version ASC'
  );
  const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

  const pending = [...MIGRATIONS].sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    if (appliedVersions.has(migration.version)) continue;

    await client.query('BEGIN');
    try {
      await client.query(migration.sql);
      await client.query(
        `INSERT INTO ath_schema_migrations (version, name)
         VALUES ($1, $2)
         ON CONFLICT (version) DO NOTHING`,
        [migration.version, migration.name]
      );
      await client.query('COMMIT');
      console.log(`[DB] Applied migration ${migration.version}: ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}

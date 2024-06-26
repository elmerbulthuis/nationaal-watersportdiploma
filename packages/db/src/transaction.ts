import { ExtractTablesWithRelations } from 'drizzle-orm'
import { PostgresJsTransaction } from 'drizzle-orm/postgres-js'
import * as schema from './schema/index.js'

export type Transaction = PostgresJsTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

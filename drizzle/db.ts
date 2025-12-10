import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function getDb(env: any) {
    return drizzle(env.DB, { schema })
}

export type DrizzleDB = ReturnType<typeof getDb>

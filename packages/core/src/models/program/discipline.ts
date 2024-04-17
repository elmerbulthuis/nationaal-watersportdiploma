import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { zod } from '../../util/zod.js'

export * as Discipline from './discipline.js'

const discipline = schema.discipline

export const Info = createSelectSchema(discipline, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
})
export type Info = typeof discipline.$inferSelect

export const create = zod(
  Info.pick({ title: true, handle: true }).partial({
    title: true,
  }),
  async (input) => {
    const query = useQuery()
    const [insert] = await query
      .insert(discipline)
      .values({
        handle: input.handle,
        title: input.title,
      })
      .returning({ id: discipline.id })

    if (!insert) {
      throw new Error('Failed to insert discipline')
    }

    return insert.id
  },
)

export const list = zod(z.void(), async () => {
  const query = useQuery()
  return await query.select().from(discipline)
})

export const fromId = zod(Info.shape.id, async (id) => {
  const query = useQuery()
  return await query
    .select()
    .from(discipline)
    .where(eq(discipline.id, id))
    .then((rows) => rows[0])
})

export const fromHandle = zod(Info.shape.handle, async (handle) => {
  const query = useQuery()
  return await query
    .select()
    .from(discipline)
    .where(eq(discipline.handle, handle))
    .then((rows) => rows[0])
})
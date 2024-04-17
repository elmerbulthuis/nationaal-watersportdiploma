import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { zod } from '../../util/zod.js'

export { Category } from './category.js'
export { Competency } from './competency.js'
export { Degree } from './degree.js'
export { Discipline } from './discipline.js'
export * as Program from './index.js'
export { Module } from './module.js'

const program = schema.program

export const Info = createSelectSchema(program, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
  disciplineId: (schema) => schema.disciplineId.uuid(),
  degreeId: (schema) => schema.degreeId.uuid(),
})
export type Info = typeof program.$inferSelect

export const create = zod(
  Info.pick({
    title: true,
    handle: true,
    disciplineId: true,
    degreeId: true,
  })
    .partial({
      title: true,
    })
    .extend({
      categoryIds: z.array(z.string()).optional(),
    }),
  async (input) => {
    const query = useQuery()

    const [insert] = await query
      .insert(program)
      .values({
        handle: input.handle,
        title: input.title,
        disciplineId: input.disciplineId,
        degreeId: input.degreeId,
      })
      .returning({ id: program.id })

    if (!insert) {
      throw new Error('Failed to insert program')
    }

    if (input.categoryIds) {
      await query.insert(schema.programCategory).values(
        input.categoryIds.map((categoryId) => ({
          programId: insert.id,
          categoryId,
        })),
      )
    }

    return insert.id
  },
)

export const list = zod(z.void(), async () => {
  const query = useQuery()
  return await query.select().from(program)
})

export const fromId = zod(Info.shape.id, async (id) => {
  const query = useQuery()
  return await query
    .select()
    .from(program)
    .where(eq(program.id, id))
    .then((rows) => rows[0])
})

export const fromHandle = zod(Info.shape.handle, async (handle) => {
  const query = useQuery()
  return await query
    .select()
    .from(program)
    .where(eq(program.handle, handle))
    .then((rows) => rows[0])
})
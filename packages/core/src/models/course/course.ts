import { schema as s } from '@nawadi/db'
import assert from 'assert'
import { SQLWrapper, and, eq, getTableColumns, inArray } from 'drizzle-orm'
import { aggregate } from 'drizzle-toolbelt'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  findItem,
  handleSchema,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { insertSchema, outputSchema } from './course.schema.js'
import { Category, Discipline } from './index.js'

export const create = withZod(
  insertSchema.extend({
    categories: uuidSchema.array().optional(),
  }),
  successfulCreateResponse,
  async (item) =>
    withTransaction(async (tx) => {
      const disciplineList = await Discipline.list()
      console.log('disciplineList course.ts', disciplineList)

      const row = await tx
        .insert(s.course)
        .values({
          title: item.title,
          handle: item.handle,
          disciplineId: item.disciplineId,
        })
        .returning({ id: s.course.id })
        .then(singleRow)

      if (!!item.categories && item.categories.length > 0) {
        await tx.insert(s.courseCategory).values(
          item.categories.map((categoryId) => ({
            courseId: row.id,
            categoryId,
          })),
        )
      }

      return row
    }),
)

export const list = withZod(
  z
    .object({
      filter: z
        .object({
          id: singleOrArray(uuidSchema).optional(),
        })
        .default({}),
    })
    .default({}),
  outputSchema.array(),
  async ({ filter }) => {
    const query = useQuery()

    const whereClausules: SQLWrapper[] = []

    if (filter.id) {
      if (Array.isArray(filter.id)) {
        whereClausules.push(inArray(s.course.id, filter.id))
      } else {
        whereClausules.push(eq(s.course.id, filter.id))
      }
    }

    // Prepare a database query to fetch programs and their categories using joins.
    const coursesPromise = query
      .select()
      .from(s.course)
      .leftJoin(s.courseCategory, eq(s.courseCategory.courseId, s.course.id))
      .where(and(...whereClausules))
      .then((rows) => {
        return Object.values(
          rows.reduce(
            (acc, { course, course_category }) => {
              if (!acc[course.id]) {
                acc[course.id] = {
                  ...course,
                  categories: [],
                }
              }

              if (!!course_category) {
                acc[course.id]!.categories.push(course_category)
              }

              return acc
            },
            {} as Record<
              string,
              (typeof rows)[number]['course'] & {
                categories: NonNullable<
                  (typeof rows)[number]['course_category']
                >[]
              }
            >,
          ),
        )
      }) // Transform joined rows into a structured format with programs and their categories.

    // Fetch additional lists of categories, degrees, and disciplines in parallel to optimize loading times.
    const [courses, categories, disciplines] = await Promise.all([
      coursesPromise,
      Category.list(),
      Discipline.list(),
    ])

    // Map over the programs to enrich them with additional data like degree, discipline, and categories.
    return courses.map((course) => {
      // Find the corresponding discipline for each program enforcing that it must exist.
      const discipline = findItem({
        items: disciplines,
        predicate(item) {
          return item.id === course.disciplineId
        },
        enforce: true, // Enforce finding the discipline, throw error if not found.
      })

      const {
        categories: courseCategories,
        disciplineId,
        ...courseProperties
      } = course

      // Construct the final program object with additional details.
      return {
        ...courseProperties,
        discipline,
        categories: categories.filter(
          (
            category, // Filter categories relevant to the current program.
          ) => courseCategories.some((pc) => pc.categoryId === category.id),
        ),
      }
    })
  },
)

export const fromHandle = withZod(
  handleSchema,
  outputSchema.nullable(),
  async (handle) => {
    const query = useQuery()

    const course = await query
      .select({
        ...getTableColumns(s.course),
        category: s.courseCategory,
      })
      .from(s.course)
      .leftJoin(s.courseCategory, eq(s.courseCategory.courseId, s.course.id))
      .where(eq(s.course.handle, handle))
      .then(
        aggregate({
          pkey: 'id',
          fields: { categories: 'category.id' },
        }),
      )
      .then(possibleSingleRow)

    if (!course) {
      return null
    }

    const [allCategories, discipline] = await Promise.all([
      Category.list(),
      Discipline.fromId(course.disciplineId),
    ])

    assert(discipline, 'Discipline not found')

    const { categories, disciplineId, ...courseProperties } = course

    return {
      ...courseProperties,
      discipline,
      categories: allCategories.filter((category) =>
        categories.some((pc) => pc.categoryId === category.id),
      ),
    }
  },
)

export const fromId = withZod(
  uuidSchema,
  outputSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const course = await query
      .select({
        ...getTableColumns(s.course),
        category: s.courseCategory,
      })
      .from(s.course)
      .leftJoin(s.courseCategory, eq(s.courseCategory.courseId, s.course.id))
      .where(eq(s.course.id, id))
      .then(
        aggregate({
          pkey: 'id',
          fields: { categories: 'category.id' },
        }),
      )
      .then(possibleSingleRow)

    if (!course) {
      return null
    }

    const [allCategories, discipline] = await Promise.all([
      Category.list(),
      Discipline.fromId(course.disciplineId),
    ])

    assert(discipline, 'Discipline not found')

    const { categories, disciplineId, ...courseProperties } = course

    return {
      ...courseProperties,
      discipline,
      categories: allCategories.filter((category) =>
        categories.some((pc) => pc.categoryId === category.id),
      ),
    }
  },
)

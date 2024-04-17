import * as api from '@nawadi/api'
import { Program, withTransaction } from '@nawadi/core'
import * as application from '../../application/index.js'

export const getPrograms: api.GetProgramsOperationHandler<
  application.Authentication
> = (incomingRequest, authentication) =>
  withTransaction(async () => {
    const programsEntity = (await Program.list()).map((item) => ({
      id: item.id,
      handle: item.handle,
      title: item.title ?? '', // TODO remove once nulls are properly supported
      degreeId: item.degreeId,
      degreeTitle: item.degreeTitle ?? '', // TODO remove once nulls are properly supported
      disciplineId: item.disciplineId,
      disciplineTitle: item.disciplineTitle ?? '', // TODO remove once nulls are properly supported
    }))

    return {
      status: 200,
      parameters: {},
      contentType: 'application/json',
      entity: () => programsEntity,
    }
  })

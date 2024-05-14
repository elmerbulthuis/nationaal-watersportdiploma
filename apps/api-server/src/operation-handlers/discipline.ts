import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const listDisciplines: api.ListDisciplinesOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const list = await core.Program.Discipline.list()

  const responseEntity = list.map((item) => ({
    id: item.id,
    handle: item.handle,
    title: item.title,
    weight: item.weight,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
  }))

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}

export const retrieveDiscipline: api.RetrieveDisciplineOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { disciplineKey } = incomingRequest.parameters

  // TODO get discipline type from core
  let disciplineItem: Awaited<
    ReturnType<typeof core.Program.Discipline.fromHandle>
  >

  if (api.validators.isComponentsHandle(disciplineKey)) {
    disciplineItem = await core.Program.Discipline.fromHandle(disciplineKey)
  } else if (api.validators.isComponentsId(disciplineKey)) {
    disciplineItem = await core.Program.Discipline.fromId(disciplineKey)
  } else {
    throw 'impossible'
  }

  if (disciplineItem == null) {
    return {
      status: 404,
      contentType: null,
    }
  }

  const responseEntity = {
    id: disciplineItem.id,
    handle: disciplineItem.handle,
  }

  return {
    status: 200,
    contentType: 'application/json',
    entity: () => responseEntity,
  }
}

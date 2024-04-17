import * as api from '@nawadi/api'
import * as authenticationHandlers from '../authentication-handlers/index.js'
import * as operationHandlers from '../operation-handlers/index.js'
import { Authentication } from './authentication.js'

export type Server = api.Server<Authentication>

export function createApplicationServer() {
  const server = new api.Server<Authentication>()

  // authentication

  server.registerApiTokenAuthentication(authenticationHandlers.apiToken)
  server.registerTokenAuthentication(authenticationHandlers.token)

  // operations

  server.registerGetProgramsOperation(operationHandlers.getPrograms)

  // middleware!

  server.registerMiddleware(api.createErrorMiddleware())
  // we could also make one transaction per request, via middleware.
  //
  // server.registerMiddleware((request, next) =>
  //   withTransaction(async () => {
  //     const respone = await next(request)
  //     return respone
  //   }),
  // )

  return server
}

import {
  CommonQueryMethods,
  createPool,
  Interceptor,
  QueryResultRow,
  QueryResultRowColumn,
  TaggedTemplateLiteralInvocation,
} from 'slonik';
import { createQueryLoggingInterceptor } from 'slonik-interceptor-query-logging';

const dbInterceptors: Interceptor[] = [createQueryLoggingInterceptor()];

export async function getPool(
  connection: string,
  maximumPoolSize: number,
  additionalInterceptors: Interceptor[] = [],
) {
  const pool = await createPool(connection, {
    interceptors: [...dbInterceptors, ...additionalInterceptors],
    captureStackTrace: false,
    maximumPoolSize,
    idleTimeout: 30000,
  });

  function interceptError<K extends Exclude<keyof CommonQueryMethods, 'transaction'>>(
    methodName: K,
  ) {
    const original: CommonQueryMethods[K] = pool[methodName];

    function interceptor<T extends QueryResultRow>(
      this: any,
      sql: TaggedTemplateLiteralInvocation<T>,
      values?: QueryResultRowColumn[],
    ): any {
      return (original as any).call(this, sql, values).catch((error: any) => {
        error.sql = sql.sql;
        error.values = sql.values || values;

        return Promise.reject(error);
      });
    }

    pool[methodName] = interceptor;
  }

  interceptError('one');
  interceptError('many');

  return pool;
}

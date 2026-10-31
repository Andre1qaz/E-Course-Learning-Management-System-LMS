import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          typeof (data as { success: unknown }).success === 'boolean'
        ) {
          // Services already return an API envelope. Normalise it instead of
          // nesting it inside a second envelope (which made `data.data`
          // double-wrapped for clients that legitimately omit `message`).
          const envelope = data as {
            success: boolean;
            data?: unknown;
            message?: unknown;
          };

          return {
            ...(data as Record<string, unknown>),
            success: envelope.success,
            data: envelope.data ?? null,
            message:
              typeof envelope.message === 'string' ? envelope.message : 'OK',
          } as ApiResponse<T>;
        }
        return {
          success: true,
          data: data ?? null,
          message: 'OK',
        };
      }),
    );
  }
}

import { createParamDecorator, BadRequestException } from '@nestjs/common';

export const ValidateUUID = createParamDecorator(
  (data: string, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const paramValue = request.params[data];
    
    if (!paramValue) {
      throw new BadRequestException(`${data} is required`);
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paramValue)) {
      throw new BadRequestException(`${data} must be a valid UUID`);
    }
    
    return paramValue;
  },
);

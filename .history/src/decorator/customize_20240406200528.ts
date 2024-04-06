import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
// tạo decorator Public để truyền thêm Metadate vào function
// Metadate sẽ được lấy theo (key, value)

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
    // ý nghĩa:
    // import {Request} from Express;
    // @Req req: Request;
    // coust user = req.user; ==> cách này không tường minh và mất 2 lần code
  },
);
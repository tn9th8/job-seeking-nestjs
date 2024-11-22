import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from 'src/decorator/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Guard sẽ check ta sẽ sử dụng jwt strategy

  constructor(private reflector: Reflector) {
    // ta sẽ dùng class Reflector (phản chiếu) để lấy Metadate ra
    super();
  }
  // For this, you can extend the built-in class and override methods within a sub-class:

  canActivate(context: ExecutionContext) {
    // Overide
    // Add your custom authentication logic here: truyền key để lấy value của metadata
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // nếu isPublic là true thì JwtAuthGuard trả về true, tức là đi tiếp
    if (isPublic) {
      return true;
    }
    // nếu không đề framework sẽ làm
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    // Overide
    // Customize the default error handling
    // Lấy kết quả từ jwt strategy (validate)
    const request: Request = context.switchToHttp().getRequest();

    const isPublicPerminssion = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Không có Token ở Bearer Token trong Request Header / Token không hợp lệ',
        )
      );
    }

    // validate each permission in user permissions
    const targetMethod = request.method;
    const targetEndpoint = request.route?.path as string;
    const permissions = user?.permissions ?? []; // ko có trả về rỗng

    let isExist = permissions.find(
      (permission) =>
        targetMethod === permission.method &&
        targetEndpoint === permission.apiPath,
    );

    // pubic permission of auth module: login, out, get account,...
    if (targetEndpoint.startsWith('/api/v1/auth')) {
      isExist = true;
    }
    if (targetEndpoint.startsWith('/api/v1/subscribers')) {
      isExist = true;
    }
    // temp
    if (targetEndpoint.includes('manager')) {
      isExist = true;
    }

    // neu ko ton tai permission + ko skip permission // 200 => 403: ko có quyền
    if (!isExist && !isPublicPerminssion) {
      throw new ForbiddenException(
        'Bạn không có quyền hạn (permission) truy cập endpoint này',
      );
    }
    return user;
  }
}

import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // username, pass la 2 tham so la Passport nem ve
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user) {
      // neu dung email va co user co ton tai
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  }

  // dùng user: any từng là TS ko biết user là cái gì, ko biết type của biến này
  async login(user: IUser) {
    const { _id, name, email, role } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      name,
      email,
      role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // async register(user: RegisterUserDto) {
  //   // chỉ hứng kết quả thôi
  //   // còn lại nén cho UserService vì nó có thể chọc đến database và hash password ...
  //   let newUser = await this.usersService.register(user);

  //   return {
  //     // have to use ? to avoid the case that newUser = null;
  //     _id: newUser?._id,
  //     createdAt: newUser?.createdAt,
  //   };
  // }
}
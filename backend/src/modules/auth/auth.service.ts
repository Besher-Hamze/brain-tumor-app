import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/common/enums/role.enum';
import { UserDocument } from '../users/schema/user.schema';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.DOCTOR,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.is_active) throw new UnauthorizedException('Account is deactivated');

    const isMatch = await this.usersService.comparePassword(
      loginDto.password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    await this.usersService.updateLastLogin(user._id.toString());

    return this.buildAuthResponse(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const publicUser = await this.usersService.findOne(userId);
    const user = await this.usersService.findByEmail(publicUser.email);
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await this.usersService.comparePassword(
      dto.old_password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('Old password is incorrect');

    await this.usersService.updatePassword(userId, dto.new_password);

    return { message: 'Password changed successfully' };
  }

  private buildAuthResponse(user: UserDocument) {
    return {
      user: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        hospital: user.hospital,
        phone: user.phone,
        is_active: user.is_active,
      },
      access_token: this.generateToken(user._id.toString(), user.role),
    };
  }

  private generateToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }
}

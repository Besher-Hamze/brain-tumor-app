import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from 'src/common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ── REGISTER ───────────────────────────────────────
  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.DOCTOR,
    });

    const access_token = this.generateToken(
      user._id.toString(),
      user.role,
    );

    return {
      user: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        hospital: user.hospital,
      },
      access_token,
    };
  }

  // ── LOGIN ──────────────────────────────────────────
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

    const access_token = this.generateToken(
      user._id.toString(),
      user.role,
    );

    return {
      user: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        hospital: user.hospital,
      },
      access_token,
    };
  }

  // ── CHANGE PASSWORD ────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByEmail(
      (await this.usersService.findOne(userId)).email,
    );
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await this.usersService.comparePassword(
      dto.old_password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('Old password is incorrect');

    const hashed = await bcrypt.hash(dto.new_password, 10);
    await this.usersService.update(userId, { password: hashed });

    return { message: 'Password changed successfully' };
  }

  // ── HELPER ─────────────────────────────────────────
  private generateToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser, Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/enums/role.enum';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register ← Public, doctor only
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`POST /auth/register → email: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    this.logger.log(`✅ Registered: ${registerDto.email}`);
    return { success: true, ...result };
  }

  // POST /api/auth/login ← Public
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`POST /auth/login → email: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    this.logger.log(`✅ Logged in: ${loginDto.email}`);
    return { success: true, ...result };
  }

  // GET /api/auth/profile ← Any logged in user
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    this.logger.log(`GET /auth/profile → user: ${user.email}`);
    return { success: true, user };
  }

  // PATCH /api/auth/change-password ← Any logged in user
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    this.logger.log(`PATCH /auth/change-password → user: ${user.email}`);
    const result = await this.authService.changePassword(
      user._id.toString(),
      dto,
    );
    return { success: true, ...result };
  }
}

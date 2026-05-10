import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, GetUserId } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`POST /auth/register -> email: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    return { success: true, ...result };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`POST /auth/login -> email: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    return { success: true, ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    this.logger.log(`GET /auth/profile -> user: ${user.email}`);
    return { success: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @GetUserId() userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    this.logger.log(`PATCH /auth/change-password -> user: ${userId}`);
    const result = await this.authService.changePassword(userId, dto);
    return { success: true, ...result };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { Public } from '../auth/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() data: any, @Req() req: Request) {
    const uid = req.user!.uid;
    const displayName = data.displayName || 'User';
    const email = data.email || req.user!.email || `${uid}@straycare.local`;
    const handle =
      data.handle ||
      `@${
        displayName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 20) ||
        email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') ||
        'user'
      }` + uid.slice(-4);
    return this.usersService.createUser({
      id: uid,
      email,
      displayName,
      handle,
      photoUrl: data.photoUrl ?? null,
      bio: data.bio ?? '',
      phone: data.phone ?? null,
      referralCode: data.referralCode ?? null,
      emailVerified: req.user!.emailVerified,
    });
  }

  @Post('presence')
  async touchPresence(@Req() req: Request) {
    return this.usersService.touchPresence(req.user!.uid);
  }

  @Public()
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Public()
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.getUser(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    const uid = req.user!.uid;
    if (id !== uid) {
      throw new BadRequestException('You can only update your own profile');
    }
    if (data.id && data.id !== uid) {
      throw new BadRequestException('Cannot change user id');
    }
    const { id: _ignored, ...updates } = data;
    return this.usersService.updateUser(uid, updates);
  }
}

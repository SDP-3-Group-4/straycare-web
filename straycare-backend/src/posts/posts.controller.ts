import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PostsService } from './posts.service';
import { Public } from '../auth/public.decorator';
import * as fs from 'fs';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(@Body() data: any, @Req() req: Request) {
    try {
      return await this.postsService.createPost({
        content: data.content,
        category: data.category,
        author: { connect: { id: req.user!.uid } },
        imageUrl: data.imageUrl,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        fundraiseGoal: data.fundraiseGoal,
      });
    } catch (e: any) {
      fs.writeFileSync(
        'create-post-error.log',
        e.message || e.toString() + '\n' + e.stack,
      );
      console.error('CREATE POST ERROR:', e);
      throw new InternalServerErrorException(e.message);
    }
  }

  @Public()
  @Get()
  async getPosts(
    @Query('tab') tab?: string,
    @Query('userId') userId?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const latitude = lat ? parseFloat(lat) : undefined;
    const longitude = lng ? parseFloat(lng) : undefined;
    return this.postsService.getPosts(tab, userId, latitude, longitude);
  }

  @Public()
  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    return this.postsService.updatePost(id, req.user!.uid, data);
  }

  @Post(':id/donate')
  async donateToPost(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Req() req: Request,
  ) {
    return this.postsService.donateToPost(id, req.user!.uid, amount);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string, @Req() req: Request) {
    return this.postsService.deletePost(id, req.user!.uid);
  }
}

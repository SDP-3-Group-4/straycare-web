import { Controller, Get, Post, Put, Delete, Body, Param, Query, InternalServerErrorException } from '@nestjs/common';
import { PostsService } from './posts.service';
import * as fs from 'fs';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(@Body() data: any) {
    try {
      return await this.postsService.createPost({
        content: data.content,
        category: data.category,
        author: { connect: { id: data.authorId } },
        imageUrl: data.imageUrl,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        fundraiseGoal: data.fundraiseGoal,
      });
    } catch (e: any) {
      fs.writeFileSync('create-post-error.log', e.message || e.toString() + '\n' + e.stack);
      console.error('CREATE POST ERROR:', e);
      throw new InternalServerErrorException(e.message);
    }
  }

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

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @Body('authorId') authorId: string,
    @Body() data: any,
  ) {
    return this.postsService.updatePost(id, authorId, data);
  }

  @Post(':id/donate')
  async donateToPost(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.postsService.donateToPost(id, userId, amount);
  }

  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Body('authorId') authorId: string,
  ) {
    return this.postsService.deletePost(id, authorId);
  }
}

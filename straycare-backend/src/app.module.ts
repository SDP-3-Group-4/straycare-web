import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { ConnectionsModule } from './connections/connections.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [FirebaseModule, PostsModule, UsersModule, MarketplaceModule, PrismaModule, ChatModule, BookmarksModule, ConnectionsModule, LikesModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

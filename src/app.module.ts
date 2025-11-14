import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { WorkspaceModule } from './workspace/workspace.module';
import { MailModule } from './mail/mail.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CustomQueryLogger } from './app.options';
import { ChannelModule } from './channel/channel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: configService.get<string>('ENV') !== 'prod',
        logging:
          configService.get<string>('ENV') !== 'prod'
            ? ['query', 'error', 'warn']
            : false,
        logger: new CustomQueryLogger(),
        maxQueryExecutionTime: 100,
      }),
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    EventEmitterModule.forRoot({ wildcard: false, maxListeners: 10 }),

    ScheduleModule.forRoot(),

    AuthModule,
    WorkspaceModule,
    ChannelModule,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

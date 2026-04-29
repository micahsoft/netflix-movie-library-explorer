import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  })

  app.enableCors({
    origin: /^http:\/\/localhost(:\d+)?$/,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )

  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`\n🎬 GraphQL API: http://localhost:${port}/graphql\n`)
}

bootstrap()

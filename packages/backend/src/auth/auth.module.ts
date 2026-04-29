import { Module } from '@nestjs/common'
import { GoogleAuthService } from './google-auth.service'
import { DriveClient } from './drive.client'

@Module({
  providers: [GoogleAuthService, DriveClient],
  exports: [DriveClient],
})
export class AuthModule {}

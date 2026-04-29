import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Auth, google } from 'googleapis'
import * as fs from 'fs'
import * as http from 'http'
import * as urlModule from 'url'

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
const CALLBACK_PORT = 3001

@Injectable()
export class GoogleAuthService implements OnModuleInit {
  private readonly logger = new Logger(GoogleAuthService.name)
  private client!: Auth.OAuth2Client

  private get credentialsPath() {
    return process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json'
  }

  private get tokenPath() {
    return process.env.GOOGLE_TOKEN_PATH || './token.json'
  }

  async onModuleInit() {
    if (process.env.DEMO_MODE === 'true') {
      this.logger.log('DEMO_MODE: skipping Google OAuth initialization')
      return
    }
    await this.initialize()
  }

  private async initialize() {
    if (!fs.existsSync(this.credentialsPath)) {
      throw new Error(
        `credentials.json not found at "${this.credentialsPath}".\n` +
          `Download it from the GCP Console (APIs & Services → Credentials) ` +
          `and place it in packages/backend/.`,
      )
    }

    const raw = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'))
    const { client_id, client_secret, redirect_uris } =
      raw.installed ?? raw.web

    const redirectUri = `http://localhost:${CALLBACK_PORT}/oauth2callback`
    this.client = new google.auth.OAuth2(client_id, client_secret, redirectUri)

    if (fs.existsSync(this.tokenPath)) {
      const token = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'))
      this.client.setCredentials(token)
      this.logger.log('Loaded existing OAuth2 token')
    } else {
      await this.authorizeInteractively()
    }

    // Persist refreshed tokens automatically
    this.client.on('tokens', (tokens) => {
      const existing = fs.existsSync(this.tokenPath)
        ? JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'))
        : {}
      fs.writeFileSync(this.tokenPath, JSON.stringify({ ...existing, ...tokens }))
    })
  }

  private authorizeInteractively(): Promise<void> {
    return new Promise((resolve, reject) => {
      const authUrl = this.client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      })

      this.logger.warn('='.repeat(60))
      this.logger.warn('First-time authorization required.')
      this.logger.warn('Open this URL in your browser:')
      this.logger.warn(authUrl)
      this.logger.warn('='.repeat(60))

      const server = http.createServer(async (req, res) => {
        if (!req.url?.startsWith('/oauth2callback')) return

        const { code } = urlModule.parse(req.url, true).query
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<h2>Authorization complete. You can close this tab.</h2>')
        server.close()

        try {
          const { tokens } = await this.client.getToken(code as string)
          this.client.setCredentials(tokens)
          fs.writeFileSync(this.tokenPath, JSON.stringify(tokens))
          this.logger.log('Authorization successful.')
          resolve()
        } catch (err) {
          reject(err)
        }
      })

      server.listen(CALLBACK_PORT, () => {
        this.logger.log(`Awaiting OAuth callback on port ${CALLBACK_PORT}...`)
      })
    })
  }

  getClient(): Auth.OAuth2Client {
    return this.client
  }
}

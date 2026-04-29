import { Injectable } from '@nestjs/common'
import { QuarantineReason } from './normalizer'

export interface QuarantinedFile {
  driveFileId: string
  folderPath: string[]
  reason: QuarantineReason
  rawSnippet: string
  timestamp: Date
}

@Injectable()
export class QuarantineLog {
  private entries: QuarantinedFile[] = []

  add(entry: QuarantinedFile) {
    this.entries.push(entry)
  }

  getAll(): QuarantinedFile[] {
    return [...this.entries]
  }

  getSummary() {
    const byReason = new Map<string, number>()
    for (const entry of this.entries) {
      byReason.set(entry.reason, (byReason.get(entry.reason) ?? 0) + 1)
    }
    return {
      total: this.entries.length,
      byReason: [...byReason.entries()].map(([reason, count]) => ({ reason, count })),
    }
  }
}

import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '../../..')
export const inputRoot = path.resolve(repoRoot, 'topic-docs')
export const outputRoot = path.resolve(repoRoot, 'app/src/data/generated/topicDocs')

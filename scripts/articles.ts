import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { lstat, mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { demoPosts } from '../src/data/demo-posts'
import { categoryCatalog } from '../src/data/categories'
import { collectPublishedPosts, parsePublishedArticle } from '../src/services/article-publication'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

async function readArticle(path: string): Promise<string> {
  const info = await stat(path)
  if (!info.isFile()) throw new Error(`${path}: 文章必须是普通 JSON 文件。`)
  if (info.size > 2_000_000) throw new Error(`${path}: JSON 文件不能超过 2 MB。`)
  return readFile(path, 'utf8')
}

export async function readArticleFiles(root: string): Promise<Record<string, string>> {
  const directory = join(root, 'src/data/articles')
  // A tracked .gitkeep makes a missing content directory an error, not an empty publication.
  const entries = await readdir(directory, { withFileTypes: true })
  const files: Record<string, string> = {}
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.name.toLowerCase().endsWith('.json')) continue
    if (!entry.isFile() || !entry.name.endsWith('.json'))
      throw new Error(`${entry.name}: 请使用普通文件和小写 .json 扩展名。`)
    files[entry.name] = await readArticle(join(directory, entry.name))
  }
  return files
}

export async function checkArticles(root = projectRoot) {
  const files = await readArticleFiles(root)
  const posts = collectPublishedPosts(demoPosts, files, categoryCatalog)
  return { files, posts }
}

async function atomicWrite(path: string, text: string) {
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, text, { encoding: 'utf8', flag: 'wx' })
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch((reason: NodeJS.ErrnoException) => {
      if (reason.code !== 'ENOENT') throw reason
    })
  }
}

function verifyPublication() {
  const result = spawnSync('bun', ['run', 'article:verify'], { cwd: projectRoot, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error('文章测试或生产构建未通过。')
}

export async function publishArticle(
  source: string,
  root = projectRoot,
  verify: () => void | Promise<void> = verifyPublication,
) {
  const draft = parsePublishedArticle(await readArticle(resolve(source)), categoryCatalog)
  const directory = join(root, 'src/data/articles')
  await mkdir(directory, { recursive: true })
  if ((await lstat(directory)).isSymbolicLink()) throw new Error('文章目录不能是符号链接。')
  const lockPath = join(directory, '.article-publish.lock')
  const lock = await open(lockPath, 'wx').catch((reason: NodeJS.ErrnoException) => {
    if (reason.code === 'EEXIST')
      throw new Error(
        '另一个发布命令正在运行；若上次进程异常退出，请确认没有发布进程后删除 .article-publish.lock。',
      )
    throw reason
  })
  try {
    const { files } = await checkArticles(root)
    const existing = Object.keys(files).find(
      (name) => parsePublishedArticle(files[name]!, categoryCatalog).id === draft.id,
    )
    // Prefix also avoids Windows reserved file names such as con.json.
    const filename = existing ?? `article-${draft.slug}.json`
    if (!existing && Object.keys(files).some((name) => name.toLowerCase() === filename))
      throw new Error(`${filename} 已被其他文章占用，不能覆盖。`)
    const text = `${JSON.stringify(draft, null, 2)}\n`
    const candidate = { ...files, [filename]: text }
    collectPublishedPosts(demoPosts, candidate, categoryCatalog)
    const target = join(directory, filename)
    await atomicWrite(target, text)
    try {
      await verify()
    } catch (reason) {
      // Preserve edits made outside this command while checks were running.
      if ((await readFile(target, 'utf8')) !== text)
        throw new Error(`检查失败，但 ${filename} 已被外部修改，未覆盖该修改。请手动检查。`, {
          cause: reason,
        })
      if (existing) await atomicWrite(target, files[existing]!)
      else await unlink(target)
      throw new Error('发布检查失败，文章文件已恢复到导入前。', { cause: reason })
    }
    return {
      filename,
      slug: draft.slug,
      updated: !!existing || demoPosts.some((post) => post.id === draft.id),
    }
  } finally {
    await lock.close()
    await unlink(lockPath)
  }
}

async function main() {
  const [command, source, ...extra] = process.argv.slice(2)
  if (command === 'check' && !source) {
    const { files, posts } = await checkArticles()
    console.log(`文章校验通过：${Object.keys(files).length} 个 JSON，合并示例后 ${posts.length} 篇公开文章。`)
  } else if (command === 'publish' && source && !extra.length) {
    const result = await publishArticle(source)
    console.log(`${result.updated ? '已更新' : '已新增'} src/data/articles/${result.filename}`)
    console.log(
      `本地检查通过，预览 /posts/${result.slug} 后提交并推送 Git；Git 关联成功后由 Cloudflare 构建部署。`,
    )
  } else {
    throw new Error('用法：bun run article:check 或 bun run article:publish <导出的 JSON 文件>')
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((reason: unknown) => {
    console.error(reason instanceof Error ? reason.message : String(reason))
    process.exitCode = 1
  })
}

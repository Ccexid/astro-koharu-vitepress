import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

interface ManifestEntry {
  file: string
  imports?: string[]
}

const folder = resolve(process.cwd(), 'dist')
const manifest = JSON.parse(await readFile(resolve(folder, '.vite/manifest.json'), 'utf8')) as Record<
  string,
  ManifestEntry
>

function dependencies(key: string, files = new Set<string>()): Set<string> {
  const entry = manifest[key]
  if (!entry || files.has(entry.file)) return files
  files.add(entry.file)
  entry.imports?.forEach((dependency) => dependencies(dependency, files))
  return files
}

const initialFiles = dependencies('index.html')
dependencies('src/pages/HomePage.vue', initialFiles)
const initialSources = await Promise.all([...initialFiles].map((file) => readFile(resolve(folder, file))))
const names = (await readdir(resolve(folder, 'assets'))).filter((name) => name.endsWith('.js'))
const scripts = await Promise.all(
  names.map(async (name) => ({ name, bytes: (await stat(resolve(folder, 'assets', name))).size })),
)
const faBatches = scripts.filter((file) => file.name.startsWith('_virtual_fa-'))
const largest = [...scripts].sort((left, right) => right.bytes - left.bytes)[0]
const report = {
  homeJavaScript: {
    files: [...initialFiles],
    bytes: initialSources.reduce((total, source) => total + source.length, 0),
    gzipBytes: initialSources.reduce((total, source) => total + gzipSync(source).length, 0),
  },
  fontAwesomeBatches: {
    count: faBatches.length,
    maxBytes: Math.max(0, ...faBatches.map((file) => file.bytes)),
  },
  largestJavaScript: largest,
}
await writeFile(resolve(folder, '.vite/build-report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.table([
  {
    项目: '首页 JS（入口、首页及共享依赖）',
    大小: `${(report.homeJavaScript.bytes / 1000).toFixed(2)} kB`,
    gzip: `${(report.homeJavaScript.gzipBytes / 1000).toFixed(2)} kB`,
  },
  {
    项目: `FA6 图标批次（${faBatches.length} 个）`,
    大小: `最大 ${(report.fontAwesomeBatches.maxBytes / 1000).toFixed(2)} kB`,
    gzip: '按预览/所选图标加载',
  },
  {
    项目: '最大 JS 文件',
    大小: `${((largest?.bytes ?? 0) / 1000).toFixed(2)} kB`,
    gzip: largest?.name ?? '',
  },
])
console.log('详细报告：dist/.vite/build-report.json')

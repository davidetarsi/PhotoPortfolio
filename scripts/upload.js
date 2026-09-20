import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readdir, readFile } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'

const SUPPORTED_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png'])

/**
 * @param {string[]} argv
 * @returns {{ album: string|null, input: string|null, help: boolean }}
 */
export function parseUploadArgs(argv) {
  const result = { album: null, input: null, help: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') result.help = true
    if (argv[i] === '--album' && argv[i + 1]) result.album = argv[++i]
    if (argv[i] === '--input' && argv[i + 1]) result.input = argv[++i]
  }
  return result
}

function makeClient() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "Variabili d'ambiente R2 mancanti. Controlla R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY nel file .env"
    )
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

async function putObject(client, bucket, key, body, contentType) {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
}

/**
 * Carica tutti i file .webp di una cartella su R2 sotto il prefix <albumSlug>/
 * e carica anche il manifest.json.
 * @param {string} albumSlug
 * @param {string} optimizedDir - percorso assoluto della cartella con i .webp
 * @returns {Promise<{ uploaded: number, manifest: Array<{name: string, width: number, height: number}> }>}
 */
export async function uploadAlbum(albumSlug, optimizedDir) {
  const bucket = process.env.R2_BUCKET_NAME
  if (!bucket) throw new Error('R2_BUCKET_NAME non impostato nel file .env')

  const client = makeClient()

  const allFiles = (await readdir(optimizedDir)).filter(f => SUPPORTED_EXTS.has(extname(f).toLowerCase()))
  const files = allFiles.sort()

  process.stdout.write(`Uploading ${files.length} files for album "${albumSlug}" to bucket "${bucket}"...\n`)

  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    const key = `${albumSlug}/${filename}`
    const filePath = join(optimizedDir, filename)
    const body = await readFile(filePath)
    const extLower = extname(filename).toLowerCase()
    const contentType = extLower === '.webp' ? 'image/webp'
      : extLower === '.png' ? 'image/png'
      : 'image/jpeg'
    process.stdout.write(`  [${i + 1}/${files.length}] ${key}\n`)
    await putObject(client, bucket, key, body, contentType)
  }

  const manifestPath = join(optimizedDir, 'manifest.json')
  const manifestBody = await readFile(manifestPath)
  const manifestKey = `${albumSlug}/manifest.json`
  process.stdout.write(`Uploading manifest: ${manifestKey}\n`)
  await putObject(client, bucket, manifestKey, manifestBody, 'application/json')

  process.stdout.write(`Upload complete: ${files.length} photos + manifest.json\n`)
  return { uploaded: files.length, manifest: JSON.parse(manifestBody.toString()) }
}

async function main() {
  const args = parseUploadArgs(process.argv.slice(2))

  if (args.help) {
    process.stdout.write(`
Usage: npm run upload -- --album <slug> --input <path-to-optimized>

  --album <slug>     Album slug (e.g. sport-album). Used as R2 path prefix.
  --input <path>     Folder containing optimized .webp files.
  --help             Show this message

Example:
  npm run upload -- --album sport-album --input /Users/davide/Foto/sport/optimized
\n`)
    process.exit(0)
  }

  if (!args.album || !args.input) {
    process.stderr.write('Error: --album and --input are required.\n')
    process.exit(1)
  }

  if (!existsSync(args.input)) {
    process.stderr.write(`Error: folder "${args.input}" does not exist.\n`)
    process.exit(1)
  }

  await uploadAlbum(args.album, args.input)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const repoRoot = path.resolve(__dirname, '..')
const inputPath = path.join(repoRoot, 'Tidyco logo-blue.png')
const outputPngPath = path.join(repoRoot, 'Tidyco logo-only.png')
const outputIcoPath = path.join(repoRoot, 'Tidyco logo-only.ico')

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function paethPredictor(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function parsePng(filePath) {
  const buffer = fs.readFileSync(filePath)
  if (!buffer.subarray(0, 8).equals(pngSignature)) {
    throw new Error('Input file is not a valid PNG: ' + filePath)
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idatParts = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    offset += 4
    const type = buffer.toString('ascii', offset, offset + 4)
    offset += 4
    const data = buffer.subarray(offset, offset + length)
    offset += length + 4

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data.readUInt8(8)
      colorType = data.readUInt8(9)
    } else if (type === 'IDAT') {
      idatParts.push(data)
    } else if (type === 'IEND') {
      break
    }
  }

  if (bitDepth !== 8) {
    throw new Error('Only 8-bit PNG files are supported')
  }

  if (![6, 2, 0].includes(colorType)) {
    throw new Error('Only grayscale, RGB, and RGBA PNG files are supported')
  }

  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 1
  const stride = width * bytesPerPixel
  const inflated = zlib.inflateSync(Buffer.concat(idatParts))
  const rgba = new Uint8ClampedArray(width * height * 4)
  let srcOffset = 0

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[srcOffset]
    srcOffset += 1
    const row = Buffer.alloc(stride)

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[srcOffset]
      srcOffset += 1
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0
      const up = y > 0 ? inflated[(y - 1) * (stride + 1) + 1 + x] : 0
      const upLeft =
        y > 0 && x >= bytesPerPixel
          ? inflated[(y - 1) * (stride + 1) + 1 + x - bytesPerPixel]
          : 0

      if (filter === 0) row[x] = raw
      else if (filter === 1) row[x] = (raw + left) & 255
      else if (filter === 2) row[x] = (raw + up) & 255
      else if (filter === 3) row[x] = (raw + Math.floor((left + up) / 2)) & 255
      else if (filter === 4) row[x] = (raw + paethPredictor(left, up, upLeft)) & 255
      else throw new Error('Unsupported PNG filter type: ' + filter)
    }

    const prevRowStart = y * (stride + 1)
    row.copy(inflated, prevRowStart + 1)

    for (let x = 0; x < width; x += 1) {
      const srcIndex = x * bytesPerPixel
      const destIndex = (y * width + x) * 4
      if (colorType === 6) {
        rgba[destIndex] = row[srcIndex]
        rgba[destIndex + 1] = row[srcIndex + 1]
        rgba[destIndex + 2] = row[srcIndex + 2]
        rgba[destIndex + 3] = row[srcIndex + 3]
      } else if (colorType === 2) {
        rgba[destIndex] = row[srcIndex]
        rgba[destIndex + 1] = row[srcIndex + 1]
        rgba[destIndex + 2] = row[srcIndex + 2]
        rgba[destIndex + 3] = 255
      } else {
        const value = row[srcIndex]
        rgba[destIndex] = value
        rgba[destIndex + 1] = value
        rgba[destIndex + 2] = value
        rgba[destIndex + 3] = 255
      }
    }
  }

  return { width, height, rgba }
}

function findVisibleBounds(image) {
  let minX = image.width
  let minY = image.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = (y * image.width + x) * 4
      const r = image.rgba[index]
      const g = image.rgba[index + 1]
      const b = image.rgba[index + 2]
      const a = image.rgba[index + 3]
      const isVisible = a > 8 && !(r > 248 && g > 248 && b > 248)
      if (!isVisible) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (maxX === -1 || maxY === -1) {
    return { x: 0, y: 0, width: image.width, height: image.height }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  }
}

function sampleBilinear(image, x, y) {
  const x0 = Math.max(0, Math.min(image.width - 1, Math.floor(x)))
  const y0 = Math.max(0, Math.min(image.height - 1, Math.floor(y)))
  const x1 = Math.max(0, Math.min(image.width - 1, x0 + 1))
  const y1 = Math.max(0, Math.min(image.height - 1, y0 + 1))
  const tx = x - x0
  const ty = y - y0
  const out = [0, 0, 0, 0]

  const points = [
    { x: x0, y: y0, w: (1 - tx) * (1 - ty) },
    { x: x1, y: y0, w: tx * (1 - ty) },
    { x: x0, y: y1, w: (1 - tx) * ty },
    { x: x1, y: y1, w: tx * ty }
  ]

  for (const point of points) {
    const idx = (point.y * image.width + point.x) * 4
    out[0] += image.rgba[idx] * point.w
    out[1] += image.rgba[idx + 1] * point.w
    out[2] += image.rgba[idx + 2] * point.w
    out[3] += image.rgba[idx + 3] * point.w
  }

  return out.map(value => Math.max(0, Math.min(255, Math.round(value))))
}

function buildSquareIconSource(image, size, padding) {
  const bounds = findVisibleBounds(image)
  const canvas = new Uint8ClampedArray(size * size * 4)
  const innerSize = size - padding * 2
  const scale = Math.min(innerSize / bounds.width, innerSize / bounds.height)
  const targetWidth = bounds.width * scale
  const targetHeight = bounds.height * scale
  const offsetX = (size - targetWidth) / 2
  const offsetY = (size - targetHeight) / 2

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const srcX = bounds.x + (x - offsetX) / scale
      const srcY = bounds.y + (y - offsetY) / scale
      const destIndex = (y * size + x) * 4

      if (
        srcX < bounds.x ||
        srcY < bounds.y ||
        srcX > bounds.x + bounds.width - 1 ||
        srcY > bounds.y + bounds.height - 1
      ) {
        canvas[destIndex] = 0
        canvas[destIndex + 1] = 0
        canvas[destIndex + 2] = 0
        canvas[destIndex + 3] = 0
        continue
      }

      const [r, g, b, a] = sampleBilinear(image, srcX, srcY)
      canvas[destIndex] = r
      canvas[destIndex + 1] = g
      canvas[destIndex + 2] = b
      canvas[destIndex + 3] = a
    }
  }

  return { width: size, height: size, rgba: canvas }
}

function encodeRgbaPng(image) {
  const rows = []
  for (let y = 0; y < image.height; y += 1) {
    const row = Buffer.alloc(1 + image.width * 4)
    row[0] = 0
    const start = y * image.width * 4
    Buffer.from(image.rgba.subarray(start, start + image.width * 4)).copy(row, 1)
    rows.push(row)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(image.width, 0)
  ihdr.writeUInt32BE(image.height, 4)
  ihdr.writeUInt8(8, 8)
  ihdr.writeUInt8(6, 9)
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)

  return Buffer.concat([
    pngSignature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    makeChunk('IEND', Buffer.alloc(0))
  ])
}

function encodeIco(pngBuffer, width, height) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry.writeUInt8(width >= 256 ? 0 : width, 0)
  entry.writeUInt8(height >= 256 ? 0 : height, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(pngBuffer.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, pngBuffer])
}

const source = parsePng(inputPath)
const iconSource = buildSquareIconSource(source, 256, 20)
const iconPng = encodeRgbaPng(iconSource)
const ico = encodeIco(iconPng, iconSource.width, iconSource.height)

fs.writeFileSync(outputPngPath, iconPng)
fs.writeFileSync(outputIcoPath, ico)

console.log('Created icon PNG:', outputPngPath)
console.log('Created icon ICO:', outputIcoPath)

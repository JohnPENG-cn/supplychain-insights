import { inflateRawSync } from 'node:zlib'

export function readZip(buffer) {
  const view = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  const eocd = findEocd(view)
  const count = view.readUInt16LE(eocd + 10)
  let offset = view.readUInt32LE(eocd + 16)
  const entries = new Map()
  for (let index = 0; index < count; index += 1) {
    if (view.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('xlsx 的目录损坏')
    }
    const method = view.readUInt16LE(offset + 10)
    const compressedSize = view.readUInt32LE(offset + 20)
    const nameLength = view.readUInt16LE(offset + 28)
    const extraLength = view.readUInt16LE(offset + 30)
    const commentLength = view.readUInt16LE(offset + 32)
    const localOffset = view.readUInt32LE(offset + 42)
    const name = view.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    const localNameLength = view.readUInt16LE(localOffset + 26)
    const localExtraLength = view.readUInt16LE(localOffset + 28)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength
    const compressed = view.subarray(dataStart, dataStart + compressedSize)
    let data
    if (method === 0) data = Buffer.from(compressed)
    else if (method === 8) data = inflateRawSync(compressed)
    else throw new Error(`不支持的压缩方式 ${method}`)
    entries.set(name, data)
    offset += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

function findEocd(view) {
  const min = Math.max(0, view.length - 22 - 65535)
  for (let index = view.length - 22; index >= min; index -= 1) {
    if (view.readUInt32LE(index) === 0x06054b50) return index
  }
  throw new Error('文件不是 xlsx')
}

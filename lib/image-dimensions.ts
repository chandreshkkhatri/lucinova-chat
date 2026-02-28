/**
 * Extract image dimensions from a raw PNG or JPEG buffer.
 * Zero-dependency — reads the binary header directly.
 *
 * Returns { width, height } or null if the format is unrecognised.
 */
export function getImageDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  if (!buffer || buffer.length < 24) return null;

  // ── PNG ────────────────────────────────────────────────────────
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  // IHDR chunk starts at byte 8; width at offset 16 (4 bytes BE), height at 20.
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // ── JPEG ───────────────────────────────────────────────────────
  // JPEG starts with FF D8. We scan for a SOFn marker (FF C0–FF CF,
  // excluding FF C4 DHT and FF CC DAC) which contains the dimensions.
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];

      // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF
      if (
        (marker >= 0xc0 && marker <= 0xcf) &&
        marker !== 0xc4 && // DHT
        marker !== 0xc8 && // reserved
        marker !== 0xcc    // DAC
      ) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }

      // Skip to the next marker using the segment length field
      const segmentLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  // ── WebP ───────────────────────────────────────────────────────
  // RIFF....WEBP header — VP8 bitstream contains dimensions
  if (
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const format = buffer.toString("ascii", 12, 16);
    if (format === "VP8 " && buffer.length >= 30) {
      // Lossy: dimensions at byte 26/28 (little-endian 16-bit)
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
    if (format === "VP8L" && buffer.length >= 25) {
      // Lossless: 14+14 bits packed in 4 bytes starting at byte 21
      const bits = buffer.readUInt32LE(21);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      return { width, height };
    }
  }

  return null;
}

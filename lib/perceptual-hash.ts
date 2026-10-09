import sharp from "sharp";

const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;

export async function perceptualHash(filePath: string) {
  const { data } = await sharp(filePath)
    .rotate()
    .resize(HASH_WIDTH, HASH_HEIGHT, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let row = 0; row < HASH_HEIGHT; row += 1) {
    for (let column = 0; column < HASH_WIDTH - 1; column += 1) {
      const offset = row * HASH_WIDTH + column;
      bits += data[offset]! > data[offset + 1]! ? "1" : "0";
    }
  }

  return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
}

export function perceptualHashDistance(left: string, right: string) {
  if (!/^[0-9a-f]{16}$/i.test(left) || !/^[0-9a-f]{16}$/i.test(right)) return Number.POSITIVE_INFINITY;
  let difference = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let distance = 0;
  while (difference > 0n) {
    distance += Number(difference & 1n);
    difference >>= 1n;
  }
  return distance;
}

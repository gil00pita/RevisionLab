import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Rebuild the example app's favicon from the same artwork shipped in the package.
// This script never changes icons in projects using the RevisionLab installer.
const artwork = await readFile(
  new URL(
    "../packages/revisionlab/assets/revisionlab-logo.svg",
    import.meta.url,
  ),
);
const sizes = [16, 32, 48, 64, 256];
const images = await Promise.all(
  sizes.map((size) =>
    sharp(artwork)
      .resize(size, size, { fit: "contain", background: "white" })
      .png()
      .toBuffer(),
  ),
);

// ICO directories point to individual PNG payloads, one per device/tab size.
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let imageOffset = directory.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index] % 256;
  directory[entry + 1] = sizes[index] % 256;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(imageOffset, entry + 12);
  imageOffset += image.length;
});
await writeFile(
  new URL("../src/app/favicon.ico", import.meta.url),
  Buffer.concat([directory, ...images]),
);

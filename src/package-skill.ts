import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { deflateRawSync } from "node:zlib";
import { dirname as pathDirname } from "node:path";
import { fileURLToPath } from "node:url";
import { formatHomePath, SKILL_NAME } from "./install-skill.js";

export const SKILL_ZIP_NAME = "benjamin-docs-skill.zip";

export interface PackageSkillOptions {
  out?: string;
  homeDir?: string;
}

export interface PackageSkillResult {
  zipPath: string;
  homeDir: string;
  entries: string[];
}

interface ZipEntry {
  path: string;
  data: Buffer;
  directory?: boolean;
}

export function packageSkill(options: PackageSkillOptions = {}): PackageSkillResult {
  const homeDir = resolve(options.homeDir ?? process.env.BENJAMIN_DOCS_HOME ?? homedir());
  const zipPath = resolveOutputPath(options.out, homeDir);
  const skill = readFileSync(getBundledSkillPath());
  const entries: ZipEntry[] = [
    { path: `${SKILL_NAME}/`, data: Buffer.alloc(0), directory: true },
    { path: `${SKILL_NAME}/SKILL.md`, data: skill },
  ];

  try {
    mkdirSync(dirname(zipPath), { recursive: true });
    writeFileSync(zipPath, createZip(entries));
  } catch (error) {
    if (isPermissionError(error)) {
      throw new Error(formatPackageSkillPermissionError(zipPath));
    }

    throw error;
  }

  return {
    zipPath,
    homeDir,
    entries: entries.map((entry) => entry.path),
  };
}

export function getDefaultSkillZipPath(homeDirOption?: string): string {
  const homeDir = resolve(homeDirOption ?? process.env.BENJAMIN_DOCS_HOME ?? homedir());
  return join(homeDir, "Downloads", SKILL_ZIP_NAME);
}

export function skillZipExists(homeDirOption?: string): boolean {
  return existsSync(getDefaultSkillZipPath(homeDirOption));
}

export function formatPackageSkillResult(result: PackageSkillResult): string {
  return [
    "Packaged benjamin-docs skill",
    "",
    `zip: ${formatHomePath(result.homeDir, result.zipPath)}`,
    "",
    "ZIP structure:",
    ...result.entries.map((entry) => `  ${entry}`),
    "",
    "Claude Desktop / Claude.ai:",
    "  Customize > Skills > Create skill > Upload a skill",
  ].join("\n");
}

export function formatPackageSkillPermissionError(zipPath: string): string {
  return [
    `Cannot write Claude skill zip to ${zipPath}.`,
    "",
    "Your terminal may not have permission to write there. On macOS, grant terminal access to Downloads, or choose another output path:",
    "  benjamin-docs package-skill --out ./benjamin-docs-skill.zip",
  ].join("\n");
}

function resolveOutputPath(out: string | undefined, homeDir: string): string {
  if (!out) return getDefaultSkillZipPath(homeDir);

  const expanded = expandHome(out, homeDir);
  if (expanded.endsWith(".zip")) return resolve(expanded);
  return resolve(expanded, SKILL_ZIP_NAME);
}

function expandHome(path: string, homeDir: string): string {
  if (path === "~") return homeDir;
  if (path.startsWith("~/")) return join(homeDir, path.slice(2));
  return path;
}

function isPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as NodeJS.ErrnoException).code;
  return code === "EPERM" || code === "EACCES";
}

function getBundledSkillPath(): string {
  const currentDir = pathDirname(fileURLToPath(import.meta.url));
  return join(currentDir, "..", "..", "skills", SKILL_NAME, "SKILL.md");
}

function createZip(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileName = Buffer.from(entry.path, "utf8");
    const compressed = entry.directory ? Buffer.alloc(0) : deflateRawSync(entry.data);
    const crc = entry.directory ? 0 : crc32(entry.data);
    const method = entry.directory ? 0 : 8;
    const local = localFileHeader(fileName, method, crc, compressed.length, entry.data.length);
    const central = centralDirectoryHeader(fileName, method, crc, compressed.length, entry.data.length, offset, entry.directory === true);

    localParts.push(local, compressed);
    centralParts.push(central);
    offset += local.length + compressed.length;
  }

  const centralOffset = offset;
  const central = Buffer.concat(centralParts);
  const end = endOfCentralDirectory(entries.length, central.length, centralOffset);

  return Buffer.concat([...localParts, central, end]);
}

function localFileHeader(fileName: Buffer, method: number, crc: number, compressedSize: number, uncompressedSize: number): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(method, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressedSize, 18);
  header.writeUInt32LE(uncompressedSize, 22);
  header.writeUInt16LE(fileName.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, fileName]);
}

function centralDirectoryHeader(
  fileName: Buffer,
  method: number,
  crc: number,
  compressedSize: number,
  uncompressedSize: number,
  offset: number,
  directory: boolean,
): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(method, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(compressedSize, 20);
  header.writeUInt32LE(uncompressedSize, 24);
  header.writeUInt16LE(fileName.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(directory ? 0x10 : 0, 38);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, fileName]);
}

function endOfCentralDirectory(entryCount: number, centralSize: number, centralOffset: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt32LE(0x06054b50, 0);
  header.writeUInt16LE(0, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(entryCount, 8);
  header.writeUInt16LE(entryCount, 10);
  header.writeUInt32LE(centralSize, 12);
  header.writeUInt32LE(centralOffset, 16);
  header.writeUInt16LE(0, 20);
  return header;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

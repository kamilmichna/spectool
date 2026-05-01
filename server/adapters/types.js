import path from "node:path";

/**
 * @typedef {Object} SpecFile
 * @property {string} path
 * @property {string} label
 * @property {string=} modified
 */

/**
 * @typedef {Object} SpecSection
 * @property {string} id
 * @property {string} label
 * @property {"proposals"|"docs"|"requirements"|"design"|"tasks"|"other"|"proposal"} type
 * @property {string=} status
 * @property {SpecFile[]=} files
 * @property {SpecSection[]=} children
 */

/**
 * @typedef {Object} FrameworkAdapter
 * @property {string} name
 * @property {(rootPath: string) => number} detect
 * @property {(rootPath: string) => Promise<SpecSection[]>} buildTree
 */

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

export { toPosixPath };

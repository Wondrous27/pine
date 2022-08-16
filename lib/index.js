import * as fs from "node:fs/promises";
import * as path from "node:path";
import chalk from "chalk";
import prettyBytes from "pretty-bytes";

class FileTree {
	constructor(filePath) {
		this.root = new FileTreeNode(filePath);
		this.fileSize = 0;
		this.directoryCount = 0;
		this.fileCount = 0;
	}
	set size(fileSize) {
		this.fileSize += fileSize;
	}
	get size() {
		return prettyBytes(this.fileSize, { bits: false });
	}
	printTreeHelper(item, indent) {
		const { shortName, subDirectories, isLastFile, isDirectory } = item;
		if (item.parentDirectory === null) {
			console.log(chalk.blue(shortName));
		} else {
			console.log(
				indent + (isLastFile ? "  └──" : "  ├──") + (isDirectory ? chalk.blue(shortName) : chalk.red(shortName))
			);

			if (isLastFile && subDirectories.length === 0) {
				console.log(indent);
			}
			indent += isLastFile ? "  " : "  │ ";
		}

		for (const sub of subDirectories) {
			this.printTreeHelper(sub, indent);
		}
	}
	printTree() {
		this.printTreeHelper(this.root, "");
	}

	findHelper(filePath, node) {
		if (node.filePath === filePath) {
			return node;
		}
		let found = null;
		for (const child of node.subDirectories) {
			if (child.isDirectory) {
				found = this.findHelper(filePath, child);
			}
		}
		return found;
	}

	/**
	 * Finds and return the FileTreeNode element with the given file path.
	 * @param {String} filePath   the level at which this file/filder is nested
	 */
	find(filePath) {
		return this.findHelper(filePath, this.root);
	}

	/**
	 * Inserts a new file/directory to the FileTree.
	 * @param {String} filePath           Path of the file to be added to the tree.
	 * @param {String} parentDirectory    Parent directory of the new file.
	 * @param {Boolean} isDirectory       Distinguish between files and directories.
	 * @param {String} fileSize           File size in bytes.
	 * @param {Boolean} isLastFile        Whether it's the last file/folder in the directory, required for printing.
	 */
	insert(filePath, parentDirectory, isDirectory, fileSize, isLastFile) {
		const parent = this.find(parentDirectory);
		parent.subDirectories.push(new FileTreeNode(filePath, parentDirectory, isDirectory, fileSize, isLastFile));
		this.size = fileSize; // increment the total fileSize
		isDirectory ? (this.directoryCount += 1) : (this.fileCount += 1);
	}
	static async constructTree(Path, depth) {
		let fileTree = new FileTree(Path);
		let total = 0;
		async function constructTreeHelper(Path, depth) {
			const files = await fs.readdir(Path);
			const filesLength = files.length - 1;
			for (const [index, file] of files.entries()) {
				const filePath = path.resolve(Path, file);
				const stat = await fs.stat(filePath);
				const isDirectory = stat.isDirectory();
				const isLastFile = index === filesLength;
				total += stat.size;
				fileTree.insert(filePath, Path, isDirectory, stat.size, isLastFile);
				if (isDirectory && depth > 0) {
					await constructTreeHelper(filePath, depth - 1);
				}
			}
		}
		await constructTreeHelper(Path, depth);
		return fileTree;
	}
}
class FileTreeNode {
	constructor(filePath, parentDirectory = null, isDirectory = true, fileSize = 0, isLastFile = true) {
		this.shortName = path.basename(filePath);
		this.filePath = filePath;
		this.parentDirectory = parentDirectory;
		this.subDirectories = [];
		this.isDirectory = isDirectory;
		this.isLastFile = isLastFile;
		this.fileSize = prettyBytes(fileSize);
	}
}

export async function pine(basePath, flags) {
	const depth = flags.depth ?? Infinity;
	basePath = basePath ?? "./";
	const tree = await FileTree.constructTree(basePath, depth);
	tree.printTree();
	if (flags.size) {
		console.log(`${tree.directoryCount} directories, ${tree.fileCount} files. Total size: ${tree.size}`);
	}
}

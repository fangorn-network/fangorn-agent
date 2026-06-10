import { DynamicStructuredTool, tool } from "langchain";
import { z } from "zod";
import { exec } from "child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, join, relative, resolve, sep } from "path";

// Directories that are never worth reading or searching.
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "build",
  "dist",
  "out",
  ".turbo",
  ".cache",
  "coverage",
]);

// Caps keep tool output small enough for local models with limited context.
const MAX_READ_CHARS = 12000;
const MAX_LIST_ENTRIES = 200;
const MAX_FIND_RESULTS = 100;
const MAX_SEARCH_RESULTS = 50;
const MAX_COMMAND_OUTPUT = 8000;
const MAX_SEARCH_FILE_SIZE = 1024 * 1024; // skip files over 1MB

const DEFAULT_COMMAND_TIMEOUT_SECONDS = 60;
const MAX_COMMAND_TIMEOUT_SECONDS = 300;

/**
 * Build the coding tools, all confined to a single workspace root.
 * Relative paths in tool args are resolved against the workspace root and
 * any path that escapes it is rejected.
 */
export function buildCodingTools(
  workspaceRoot: string,
): DynamicStructuredTool[] {
  const root = resolve(workspaceRoot);

  function resolveInWorkspace(path: string): string {
    const inWorkspace = (p: string) => p === root || p.startsWith(root + sep);
    const resolved = resolve(root, path);
    if (inWorkspace(resolved)) return resolved;
    // Models often pass absolute-looking paths ("/", "/src/app.ts") meaning
    // workspace-relative ones — re-root those instead of failing.
    const rerooted = resolve(root, path.replace(/^[/\\]+/, ""));
    if (inWorkspace(rerooted)) return rerooted;
    throw new Error(
      `Path "${path}" is outside the workspace root (${root}). Use a path inside the workspace.`,
    );
  }

  function isBinary(content: Buffer): boolean {
    const sample = content.subarray(0, 4096);
    return sample.includes(0);
  }

  function* walkFiles(start: string): Generator<string> {
    const entries = readdirSync(start, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        yield* walkFiles(join(start, entry.name));
      } else if (entry.isFile()) {
        yield join(start, entry.name);
      }
    }
  }

  const readFile = tool(
    async ({ path, startLine, endLine }) => {
      const target = resolveInWorkspace(path);
      if (!existsSync(target)) {
        throw new Error(`File not found: ${path}`);
      }
      if (statSync(target).isDirectory()) {
        throw new Error(`${path} is a directory. Use list_directory instead.`);
      }
      const raw = readFileSync(target);
      if (isBinary(raw)) {
        throw new Error(
          `${path} looks like a binary file and cannot be read as text.`,
        );
      }
      const lines = raw.toString("utf8").split("\n");
      const start = Math.max(1, startLine ?? 1);
      const end = Math.min(lines.length, endLine ?? lines.length);
      let selected = lines
        .slice(start - 1, end)
        .map((line, i) => `${start + i}: ${line}`)
        .join("\n");
      let truncated = false;
      if (selected.length > MAX_READ_CHARS) {
        selected = selected.slice(0, MAX_READ_CHARS);
        truncated = true;
      }
      const header = `${path} (lines ${start}-${end} of ${lines.length})`;
      const footer = truncated
        ? `\n[Output truncated. Request a smaller range with startLine/endLine.]`
        : "";
      return `${header}\n${selected}${footer}`;
    },
    {
      name: "read_file",
      description:
        "Read a text file from the workspace. Returns numbered lines. Use startLine/endLine to read part of a large file.",
      schema: z.object({
        path: z.string().describe("File path relative to the workspace root"),
        startLine: z
          .number()
          .optional()
          .describe("First line to read (1-based, optional)"),
        endLine: z
          .number()
          .optional()
          .describe("Last line to read (inclusive, optional)"),
      }),
    },
  );

  const listDirectory = tool(
    async ({ path }) => {
      const target = resolveInWorkspace(path ?? ".");
      if (!existsSync(target)) {
        throw new Error(`Directory not found: ${path ?? "."}`);
      }
      const entries = readdirSync(target, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
      const shown = entries.slice(0, MAX_LIST_ENTRIES);
      const footer =
        entries.length > shown.length
          ? `\n[${entries.length - shown.length} more entries not shown]`
          : "";
      return `${path ?? "."}:\n${shown.join("\n")}${footer}`;
    },
    {
      name: "list_directory",
      description:
        "List the files and folders in a workspace directory. Folder names end with '/'.",
      schema: z.object({
        path: z
          .string()
          .optional()
          .describe(
            "Directory path relative to the workspace root. Omit for the root itself.",
          ),
      }),
    },
  );

  const findFiles = tool(
    async ({ nameContains, path }) => {
      const start = resolveInWorkspace(path ?? ".");
      const needle = nameContains.toLowerCase();
      const matches: string[] = [];
      for (const file of walkFiles(start)) {
        const rel = relative(root, file);
        if (rel.toLowerCase().includes(needle)) {
          matches.push(rel);
          if (matches.length >= MAX_FIND_RESULTS) break;
        }
      }
      if (matches.length === 0) {
        return `No files matching "${nameContains}" found.`;
      }
      const footer =
        matches.length >= MAX_FIND_RESULTS
          ? `\n[Stopped at ${MAX_FIND_RESULTS} results. Narrow the search.]`
          : "";
      return matches.join("\n") + footer;
    },
    {
      name: "find_files",
      description:
        "Find files whose path contains the given text (case-insensitive). Ignores node_modules, .git, and build output.",
      schema: z.object({
        nameContains: z
          .string()
          .describe(
            "Text the file path must contain, e.g. 'server.ts' or 'src/hooks'",
          ),
        path: z
          .string()
          .optional()
          .describe("Directory to search in, relative to the workspace root"),
      }),
    },
  );

  const searchCode = tool(
    async ({ query, path }) => {
      const start = resolveInWorkspace(path ?? ".");
      const results: string[] = [];
      let done = false;
      for (const file of walkFiles(start)) {
        if (done) break;
        const stats = statSync(file);
        if (stats.size > MAX_SEARCH_FILE_SIZE) continue;
        const raw = readFileSync(file);
        if (isBinary(raw)) continue;
        const lines = raw.toString("utf8").split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(query.toLowerCase())) {
            const text =
              lines[i].length > 200 ? lines[i].slice(0, 200) + "…" : lines[i];
            results.push(`${relative(root, file)}:${i + 1}: ${text.trim()}`);
            if (results.length >= MAX_SEARCH_RESULTS) {
              done = true;
              break;
            }
          }
        }
      }
      if (results.length === 0) {
        return `No matches for "${query}".`;
      }
      const footer = done
        ? `\n[Stopped at ${MAX_SEARCH_RESULTS} matches. Narrow the search.]`
        : "";
      return results.join("\n") + footer;
    },
    {
      name: "search_code",
      description:
        "Search file contents for a text string (case-insensitive). Returns file:line: matched text. Ignores node_modules, .git, and build output.",
      schema: z.object({
        query: z.string().describe("Text to search for, e.g. a function name"),
        path: z
          .string()
          .optional()
          .describe("Directory to search in, relative to the workspace root"),
      }),
    },
  );

  const writeFile = tool(
    async ({ path, content }) => {
      const target = resolveInWorkspace(path);
      if (existsSync(target) && statSync(target).isDirectory()) {
        throw new Error(`${path} is a directory.`);
      }
      const existed = existsSync(target);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content, "utf8");
      const lineCount = content.split("\n").length;
      return `${existed ? "Overwrote" : "Created"} ${path} (${lineCount} lines).`;
    },
    {
      name: "write_file",
      description:
        "Create a new file or completely replace an existing one. Parent directories are created automatically. To change part of a file, use edit_file instead.",
      schema: z.object({
        path: z.string().describe("File path relative to the workspace root"),
        content: z.string().describe("The full content of the file"),
      }),
    },
  );

  const editFile = tool(
    async ({ path, oldText, newText }) => {
      const target = resolveInWorkspace(path);
      if (!existsSync(target)) {
        throw new Error(`File not found: ${path}`);
      }
      const content = readFileSync(target, "utf8");
      const occurrences = content.split(oldText).length - 1;
      if (occurrences === 0) {
        throw new Error(
          `oldText was not found in ${path}. Read the file and copy the text exactly, including whitespace.`,
        );
      }
      if (occurrences > 1) {
        throw new Error(
          `oldText appears ${occurrences} times in ${path}. Include more surrounding lines so it matches exactly once.`,
        );
      }
      writeFileSync(target, content.replace(oldText, newText), "utf8");
      return `Edited ${path}.`;
    },
    {
      name: "edit_file",
      description:
        "Replace one exact text snippet in a file with new text. oldText must match the file exactly once — read the file first to copy it precisely.",
      schema: z.object({
        path: z.string().describe("File path relative to the workspace root"),
        oldText: z
          .string()
          .describe(
            "The exact existing text to replace (must be unique in the file)",
          ),
        newText: z.string().describe("The replacement text"),
      }),
    },
  );

  const runCommand = tool(
    async ({ command, timeoutSeconds }) => {
      const timeout =
        Math.min(
          timeoutSeconds ?? DEFAULT_COMMAND_TIMEOUT_SECONDS,
          MAX_COMMAND_TIMEOUT_SECONDS,
        ) * 1000;
      return await new Promise<string>((resolvePromise) => {
        exec(
          command,
          { cwd: root, timeout, maxBuffer: 10 * 1024 * 1024 },
          (error, stdout, stderr) => {
            const clip = (s: string) =>
              s.length > MAX_COMMAND_OUTPUT
                ? s.slice(0, MAX_COMMAND_OUTPUT) + "\n[output truncated]"
                : s;
            const parts: string[] = [];
            if (error?.killed) {
              parts.push(`Command timed out after ${timeout / 1000}s.`);
            }
            parts.push(`exit code: ${error?.code ?? 0}`);
            if (stdout.trim()) parts.push(`stdout:\n${clip(stdout.trim())}`);
            if (stderr.trim()) parts.push(`stderr:\n${clip(stderr.trim())}`);
            resolvePromise(parts.join("\n"));
          },
        );
      });
    },
    {
      name: "run_command",
      description:
        "Run a shell command in the workspace root and return its exit code and output. Use for builds, tests, git, and package managers. Commands must be non-interactive.",
      schema: z.object({
        command: z
          .string()
          .describe("The shell command to run, e.g. 'npm test'"),
        timeoutSeconds: z
          .number()
          .optional()
          .describe("Max seconds to wait (default 60, max 300)"),
      }),
    },
  );

  return [
    readFile,
    listDirectory,
    findFiles,
    searchCode,
    writeFile,
    editFile,
    runCommand,
  ];
}

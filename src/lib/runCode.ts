/**
 * runCode.ts
 * Runner for JS (Worker sandbox) and Python (Pyodide).
 */

export type RunResult = {
  stdout: string[];
  stderr: string[];
  error?: string;
};

export type TestCase = { input: string; expected: string };
export type TestResult = {
  passed: boolean;
  actual: string;
  expected: string;
  error?: string;
};

function toStringError(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

function splitTopLevelCommas(s: string): string[] {
  const parts: string[] = [];
  let buf = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const prev = s[i - 1];
    if (ch === "'" && !inDouble && prev !== "\\") inSingle = !inSingle;
    else if (ch === '"' && !inSingle && prev !== "\\") inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
      else if (ch === "," && depth === 0) {
        parts.push(buf.trim());
        buf = "";
        continue;
      }
    }
    buf += ch;
  }
  if (buf.trim().length) parts.push(buf.trim());
  return parts.filter(Boolean);
}

/* -------------------- Helper: timeout wrapper -------------------- */

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return p;
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

/* -------------------- JavaScript runner (Worker) -------------------- */

export async function runJavaScript(code: string, timeoutMs = 5000): Promise<RunResult> {
  return new Promise<RunResult>((resolve) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    let finished = false;

    const workerCode = `
      self.console = {
        log: (...args) => self.postMessage({type: 'log', data: args.map(a => {
          try { return JSON.stringify(a) } catch { return String(a) }
        }).join(' ') }),
        info: (...args) => self.postMessage({type: 'log', data: args.join(' ') }),
        warn: (...args) => self.postMessage({type: 'warn', data: args.join(' ') }),
        error: (...args) => self.postMessage({type: 'error', data: args.join(' ') })
      };
      self.onmessage = function(e) {
        const code = e.data;
        try {
          const result = eval(code);
          self.postMessage({type: 'done', result: typeof result === 'undefined' ? null : String(result)});
        } catch (err) {
          self.postMessage({type: 'exception', error: (err && err.stack) ? err.stack : String(err)});
        } finally {
          try { self.close(); } catch {}
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        worker.terminate();
        resolve({ stdout, stderr, error: `Execution timed out after ${timeoutMs}ms` });
      }
    }, timeoutMs);

    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as { type?: string; data?: unknown; error?: string; result?: unknown };
      if (finished) return;
      if (msg.type === "log") stdout.push(String(msg.data ?? ""));
      else if (msg.type === "warn") stderr.push(String(msg.data ?? ""));
      else if (msg.type === "error") stderr.push(String(msg.data ?? ""));
      else if (msg.type === "exception") {
        finished = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, error: String(msg.error ?? "Exception") });
      } else if (msg.type === "done") {
        finished = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, error: undefined });
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      stderr.push(String(e.message || "Worker error"));
      resolve({ stdout, stderr, error: String(e.message || "Worker error") });
    };

    worker.postMessage(code);
  });
}

/* -------------------- JavaScript tests runner (captures console) -------------------- */

export async function runJavaScriptTests(
  userCode: string,
  functionName: string,
  tests: TestCase[],
  timeoutMs = 8000
): Promise<{ results: TestResult[]; console: string[]; error?: string }> {
  return new Promise((resolve) => {
    const consoleLines: string[] = [];

    const workerCode = `
      // override console to forward logs to host
      self.console = {
        log: (...args) => self.postMessage({type: 'log', data: args.map(a => {
          try { return JSON.stringify(a) } catch { return String(a) }
        }).join(' ') }),
        info: (...args) => self.postMessage({type: 'log', data: args.join(' ') }),
        warn: (...args) => self.postMessage({type: 'warn', data: args.join(' ') }),
        error: (...args) => self.postMessage({type: 'error', data: args.join(' ') })
      };

      self.onmessage = function(e) {
        const { userCode, functionName, tests } = e.data;
        const results = [];
        try {
          eval(userCode);
          const fn = (typeof self[functionName] === 'function') ? self[functionName] : (typeof eval(functionName) === 'function' ? eval(functionName) : null);
          const fnStr = fn ? fn.toString() : '';
          let paramNames = [];
          if (fnStr) {
            const m = fnStr.match(/^function\\s*[^(]*\\(([^)]*)\\)/) || fnStr.match(/^\\(([^)]*)\\)\\s*=>/) || fnStr.match(/^[^(]*\\(([^)]*)\\)\\s*=>/);
            if (m && m[1]) {
              paramNames = m[1].split(',').map(s => s.trim()).filter(Boolean);
            }
          }
          const splitTopLevel = function(s) {
            const parts = [];
            let buf = '';
            let depth = 0, inSingle=false, inDouble=false;
            for (let i=0;i<s.length;i++){
              const ch = s[i], prev = s[i-1];
              if (ch === "'" && !inDouble && prev !== '\\\\') inSingle = !inSingle;
              else if (ch === '"' && !inSingle && prev !== '\\\\') inDouble = !inDouble;
              else if (!inSingle && !inDouble) {
                if (ch === '(' || ch === '[' || ch === '{') depth++;
                else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth-1);
                else if (ch === ',' && depth === 0) {
                  parts.push(buf.trim());
                  buf = '';
                  continue;
                }
              }
              buf += ch;
            }
            if (buf.trim()) parts.push(buf.trim());
            return parts.filter(Boolean);
          };
          for (let t of tests) {
            try {
              const stmts = splitTopLevel(t.input).map(s => s.endsWith(';') ? s : s + ';').join('\\n');
              (function(){
                // run setup / variable declarations that input may contain
                eval(stmts);
                let args = [];
                for (let p of paramNames) {
                  try { args.push(eval(p)); } catch(e) { args.push(undefined); }
                }
                let result;
                if (fn) result = fn.apply(null, args);
                else {
                  const f2 = eval(functionName);
                  if (typeof f2 === 'function') result = f2.apply(null, args);
                  else throw new Error('Function ' + functionName + ' not found');
                }
                let actual;
                try { actual = JSON.stringify(result); } catch(e) { actual = String(result); }
                results.push({ passed: false, actual: actual, expected: t.expected, output: null });
              })();
            } catch (err) {
              results.push({ passed: false, actual: '', expected: t.expected, error: (err && err.stack) ? err.stack : String(err), output: null });
            }
          }
          for (let r of results) {
            if (r.error) continue;
            try {
              const a = JSON.parse(r.actual);
              const eVal = JSON.parse(r.expected);
              r.passed = JSON.stringify(a) === JSON.stringify(eVal);
            } catch (e) {
              r.passed = r.actual === JSON.stringify(r.expected) || r.actual === r.expected;
            }
          }
          self.postMessage({ type: 'done', results });
        } catch (err) {
          self.postMessage({ type: 'error', error: (err && err.stack) ? err.stack : String(err) });
        } finally {
          try { self.close(); } catch {}
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    const timer = setTimeout(() => {
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
      resolve({ results: [], console: consoleLines, error: "Timeout" });
    }, timeoutMs);

    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as { type?: string; results?: TestResult[]; error?: string; data?: unknown };
      if (msg.type === "log") {
        consoleLines.push(String(msg.data ?? ""));
        return;
      } else if (msg.type === "warn" || msg.type === "error") {
        consoleLines.push(String(msg.data ?? ""));
        return;
      } else if (msg.type === "done") {
        clearTimeout(timer);
        resolve({ results: msg.results ?? [], console: consoleLines });
      } else if (msg.type === "error") {
        clearTimeout(timer);
        resolve({ results: [], console: consoleLines, error: msg.error });
      } else {
        // unknown - ignore
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      clearTimeout(timer);
      resolve({ results: [], console: consoleLines, error: String(e.message || "Worker error") });
    };

    worker.postMessage({ userCode, functionName, tests });
  });
}

/* -------------------- Pyodide types and loader -------------------- */

interface PyodideGlobals {
  get(name: string): unknown;
  del(name: string): void;
}

interface PyodideLike {
  runPythonAsync(code: string): Promise<void>;
  globals: PyodideGlobals;
}

type LoadPyodideFn = (opts?: { indexURL?: string }) => Promise<PyodideLike>;

let pyodideReady: Promise<PyodideLike> | null = null;

async function loadPyodideIfNeeded(): Promise<PyodideLike> {
  const win = window as unknown as { loadPyodide?: LoadPyodideFn };
  if (typeof win.loadPyodide === "function" && pyodideReady === null) {
    return win.loadPyodide({});
  }
  if (!pyodideReady) {
    pyodideReady = new Promise<PyodideLike>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
      script.onload = async () => {
        try {
          const loader = (window as unknown as { loadPyodide?: LoadPyodideFn }).loadPyodide;
          if (typeof loader !== "function") {
            reject(new Error("loadPyodide not available after script load"));
            return;
          }
          const py = await loader({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/" });
          resolve(py);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = () => reject(new Error("Failed to load Pyodide"));
      document.head.appendChild(script);
    });
  }
  return pyodideReady;
}

/* -------------------- Python runner (Pyodide) -------------------- */

export async function runPython(code: string, timeoutMs = 10000): Promise<RunResult> {
  try {
    const py = await withTimeout(loadPyodideIfNeeded(), timeoutMs);
    const safeCode = code.replace(/\\/g, "\\\\").replace(/"""/g, '\\"""');
    const wrapped = `
import sys, io, traceback
buf = io.StringIO()
errbuf = io.StringIO()
old_out, old_err = sys.stdout, sys.stderr
sys.stdout, sys.stderr = buf, errbuf
try:
    exec("""${safeCode}""")
except Exception:
    traceback.print_exc()
sys.stdout, sys.stderr = old_out, old_err
output = buf.getvalue()
err = errbuf.getvalue()
`;
    try {
      await withTimeout(py.runPythonAsync(wrapped), timeoutMs);
    } catch (err) {
      if (err instanceof Error && err.message === "Timeout") {
        return { stdout: [], stderr: [], error: `Execution timed out after ${timeoutMs}ms` };
      }
      throw err;
    }
    const output = py.globals.get("output") ?? "";
    const errOut = py.globals.get("err") ?? "";
    const stdout = String(output).split(/\r?\n/).filter(Boolean);
    const stderr = String(errOut).split(/\r?\n/).filter(Boolean);
    return { stdout, stderr, error: stderr.length ? undefined : undefined };
  } catch (err) {
    return { stdout: [], stderr: [], error: toStringError(err) };
  }
}

/* -------------------- Python tests runner (captures stdout per test) -------------------- */

export async function runPythonTests(
  userCode: string,
  functionName: string,
  tests: TestCase[],
  timeoutMs = 20000
): Promise<{ results: TestResult[]; console: string[]; error?: string }> {
  try {
    const runAll = async (): Promise<{ results: TestResult[]; console: string[] }> => {
      const py = await loadPyodideIfNeeded();
      const results: TestResult[] = [];
      const consoleLines: string[] = [];

      const fnMatch = userCode.match(new RegExp(`def\\s+${functionName}\\s*\\(([^)]*)\\)`));
      const paramNames =
        fnMatch && fnMatch[1]
          ? fnMatch[1]
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const wrapperPrefix = `
import json, traceback, sys, io
${userCode}
def __run_case(setup_code, func_name, param_names):
    try:
        buf = io.StringIO()
        errbuf = io.StringIO()
        old_out, old_err = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = buf, errbuf
        local_vars = {}
        exec(setup_code, globals(), local_vars)
        f = globals().get(func_name) or local_vars.get(func_name)
        if f is None:
            sys.stdout, sys.stderr = old_out, old_err
            return json.dumps({"ok": False, "error": "Function not found: " + func_name, "output": buf.getvalue() + errbuf.getvalue()})
        args = [ local_vars.get(n, globals().get(n)) for n in param_names ]
        try:
            res = f(*args)
            # try to JSON-encode result; if not possible, mark as string
            try:
                actual = json.dumps(res)
            except Exception:
                actual = "__PY_STR__:" + str(res)
            out = buf.getvalue() + errbuf.getvalue()
            sys.stdout, sys.stderr = old_out, old_err
            return json.dumps({"ok": True, "actual": actual, "output": out})
        except Exception as ex:
            errtxt = traceback.format_exc()
            sys.stdout, sys.stderr = old_out, old_err
            return json.dumps({"ok": False, "error": errtxt, "output": buf.getvalue() + errbuf.getvalue()})
    except Exception:
        try:
            sys.stdout, sys.stderr = old_out, old_err
        except:
            pass
        return json.dumps({"ok": False, "error": traceback.format_exc(), "output": ""})
`;

      for (const t of tests) {
        try {
          const topParts = splitTopLevelCommas(t.input).join("\n");
          const callCode = `${wrapperPrefix}\n__result = __run_case(${JSON.stringify(topParts)}, ${JSON.stringify(functionName)}, ${JSON.stringify(paramNames)})`;
          await py.runPythonAsync(callCode);
          const r = py.globals.get("__result");
          const jsonStr = String(r ?? "");
          try {
            const parsed = JSON.parse(jsonStr);
            // append any captured output lines
            if (parsed.output) {
              parsed.output.split(/\\r?\\n/).forEach((ln: string) => {
                if (ln && ln.trim().length) consoleLines.push(ln);
              });
            }
            if (!parsed.ok) {
              results.push({ passed: false, actual: "", expected: t.expected, error: parsed.error ?? "" });
            } else {
              const actualVal = String(parsed.actual ?? "");
              if (actualVal.startsWith("__PY_STR__:")) {
                results.push({ passed: false, actual: actualVal.replace("__PY_STR__:", ""), expected: t.expected });
              } else {
                results.push({ passed: false, actual: actualVal, expected: t.expected });
              }
            }
          } catch (err) {
            // fallback if __result not JSON
            const txt = jsonStr;
            if (txt && txt.length) {
              txt.split(/\\r?\\n/).forEach((ln) => {
                if (ln && ln.trim().length) consoleLines.push(ln);
              });
            }
            results.push({
              passed: false,
              actual: "",
              expected: t.expected,
              error: "Failed to parse python test result",
            });
          }
          try {
            py.globals.del("__result");
          } catch {}
        } catch (err) {
          results.push({ passed: false, actual: "", expected: t.expected, error: toStringError(err) });
        }
      }

      for (const r of results) {
        if (r.error) continue;
        try {
          const a = JSON.parse(r.actual);
          const eVal = JSON.parse(r.expected);
          r.passed = JSON.stringify(a) === JSON.stringify(eVal);
        } catch {
          r.passed = r.actual === JSON.stringify(r.expected) || r.actual === r.expected;
        }
      }

      return { results, console: consoleLines };
    };

    try {
      return await withTimeout(
        runAll().then(({ results, console }) => ({ results, console })),
        timeoutMs
      );
    } catch (err) {
      if (err instanceof Error && err.message === "Timeout") {
        return { results: [], console: [], error: `Execution timed out after ${timeoutMs}ms` };
      }
      throw err;
    }
  } catch (err) {
    return { results: [], console: [], error: toStringError(err) };
  }
}

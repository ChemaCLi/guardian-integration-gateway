---
name: check-stability
description: Runs the project with npm run dev after changes to verify it still works. Returns success or reports errors with explanation and fix suggestions. Use when an agent or subagent has completed changes and stability verification is needed.
---

# Check Stability

## Mission

Detect if the project stops working after a change. When changes are complete, run the app and report whether it still works or what went wrong and how to fix it.

## When to Run

- After an agent or subagent has finished making changes to the project
- When the user or workflow asks to verify stability

## Instructions

1. **Run the project**
   - Execute: `npm run dev`
   - Let it run long enough to see startup (e.g. a few seconds). If the app is a server, look for a "listening" or "started" message.
   - Use a short timeout (e.g. 5–10 seconds) so the command does not run indefinitely; then stop the process if it is still running.

2. **Interpret the result**
   - **Success**: Process started without exiting with an error; you saw a normal startup message (e.g. server listening on a port). → Go to step 3a.
   - **Failure**: Process exited with a non-zero code, or printed an error/stack trace to stderr. → Go to step 3b.

3. **Report**
   - **3a. Success**  
     Return a short success message, e.g.:  
     `Stability check passed. The project runs successfully with \`npm run dev\`.`
   - **3b. Failure**  
     - **Notify**: Clearly state that the stability check failed.
     - **Error**: Quote or summarize the relevant error output (message, stack trace, exit code).
     - **Explain**: In one or two sentences, say what went wrong (e.g. missing dependency, syntax error, wrong path).
     - **Suggest**: Give one to three concrete steps to fix it (e.g. install a package, fix a typo, correct an import path).

## Example success output

```text
Stability check passed. The project runs successfully with `npm run dev`.
```

## Example failure output

```text
Stability check failed.

Error: [paste or summarize the error and stack trace]

Explanation: The server fails because [brief reason].

Suggestions:
1. [First concrete fix]
2. [Second if needed]
3. [Third if needed]
```

## Notes

- Run `npm run dev` from the project root (where `package.json` is).
- If the project has no `dev` script, use the main start command (e.g. `npm start`) and say so in the report.

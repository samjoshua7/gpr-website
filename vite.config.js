import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Local Explorer Bridge Plugin:
 * Allows the browser UI running locally to open Windows File Explorer
 * and auto-select the exact downloaded invoice/statement file on disk.
 */
function revealInExplorerPlugin() {
  return {
    name: 'reveal-in-explorer',
    configureServer(server) {
      server.middlewares.use('/api/reveal-in-explorer', (req, res) => {
        try {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Private-Network', 'true');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const rawTargetPath = url.searchParams.get('path');
          if (!rawTargetPath) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'No path provided' }));
            return;
          }

          const targetPath = decodeURIComponent(rawTargetPath).trim();
          const userHome = os.homedir();
          const candidateBases = [
            path.join(userHome, 'Documents'),
            path.join(userHome, 'Downloads'),
            path.join(userHome, 'Desktop'),
            userHome,
            'C:\\',
            'D:\\',
          ];

          let resolvedPath = null;
          if (path.isAbsolute(targetPath) && fs.existsSync(targetPath)) {
            resolvedPath = path.normalize(targetPath);
          } else {
            for (const base of candidateBases) {
              const directCheck = path.join(base, targetPath);
              if (fs.existsSync(directCheck)) {
                resolvedPath = path.normalize(directCheck);
                break;
              }
              const gprCheck = path.join(base, 'gpr', targetPath);
              if (fs.existsSync(gprCheck)) {
                resolvedPath = path.normalize(gprCheck);
                break;
              }
              const gprPdfCheck = path.join(base, 'gpr', 'pdf', path.basename(targetPath));
              if (fs.existsSync(gprPdfCheck)) {
                resolvedPath = path.normalize(gprPdfCheck);
                break;
              }
              const gprJpgCheck = path.join(base, 'gpr', 'jpg', path.basename(targetPath));
              if (fs.existsSync(gprJpgCheck)) {
                resolvedPath = path.normalize(gprJpgCheck);
                break;
              }
              const gprAccCheck = path.join(base, 'gpr', 'accounts', path.basename(targetPath));
              if (fs.existsSync(gprAccCheck)) {
                resolvedPath = path.normalize(gprAccCheck);
                break;
              }
            }
          }

          if (resolvedPath && fs.existsSync(resolvedPath)) {
            try {
              // CRITICAL: Windows explorer.exe requires /select,"<path>" where the path ONLY is enclosed in quotes.
              // Node's spawn without windowsVerbatimArguments wraps the entire argument including /select in quotes,
              // causing explorer.exe to fail parsing and fall back to opening the parent Documents folder.
              // windowsVerbatimArguments: true ensures CreateProcess receives: explorer.exe /select,"C:\path\to\file.pdf"
              const child = spawn('explorer.exe', [`/select,"${resolvedPath}"`], {
                windowsVerbatimArguments: true,
                detached: true,
                stdio: 'ignore',
              });
              child.unref();

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, method: 'explorer', path: resolvedPath }));
            } catch (err) {
              console.error('Failed to spawn explorer.exe:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'File not found on disk' }));
          }
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), revealInExplorerPlugin()],
});

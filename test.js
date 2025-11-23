#!/usr/bin/env node

/**
 * Gate 7 Coffee - Production Build Test Server
 * Serves minified production build from /dist folder
 * Allows testing before deployment to GitHub Pages
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const DIST_DIR = path.join(__dirname, 'dist');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

function log(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        info: `${colors.cyan}ℹ${colors.reset}`,
        success: `${colors.green}✓${colors.reset}`,
        warning: `${colors.yellow}⚠${colors.reset}`,
        error: `${colors.red}✗${colors.reset}`
    }[level] || '';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// Route aliases (map old URLs to new locations)
const routeAliases = {
    '/music/spotify': '/music/index.html'
};

// MIME types
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// Check if dist folder exists
if (!fs.existsSync(DIST_DIR)) {
    console.error(`\n${colors.red}${colors.bright}❌ ERROR: dist/ folder not found!${colors.reset}`);
    console.error(`${colors.yellow}Please run 'npm run build' first${colors.reset}\n`);
    process.exit(1);
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Apply route aliases (for backward compatibility)
    if (routeAliases[pathname]) {
        log('info', `Routing: ${pathname} → ${routeAliases[pathname]}`);
        pathname = routeAliases[pathname];
    }
    
    // Default to index.html for root
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Construct file path
    let filePath = path.join(DIST_DIR, pathname);
    
    // Security: prevent directory traversal
    const realPath = path.resolve(filePath);
    if (!realPath.startsWith(DIST_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        log('warning', `Blocked directory traversal attempt: ${pathname}`);
        return;
    }
    
    // Check if file exists
    fs.stat(filePath, (err, stat) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>404 - Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        p { color: #666; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    <h1>404 - Not Found</h1>
    <p>The requested file was not found in the production build.</p>
    <p>Requested: <code>${pathname}</code></p>
    <p><a href="/">Go back to home</a></p>
</body>
</html>
            `);
            log('warning', `404: ${pathname}`);
            return;
        }
        
        // If directory, look for index.html
        if (stat.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
            fs.stat(filePath, (err, stat) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                    return;
                }
                serveFile(filePath);
            });
            return;
        }
        
        // Serve file
        serveFile(filePath);
    });
    
    function serveFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                // Try with .html extension if file not found and no extension provided
                if (!ext && !pathname.endsWith('/')) {
                    const htmlPath = filePath + '.html';
                    fs.readFile(htmlPath, (err2, data2) => {
                        if (!err2) {
                            res.writeHead(200, {
                                'Content-Type': 'text/html; charset=utf-8',
                                'Cache-Control': 'no-cache'
                            });
                            res.end(data2);
                            const fileSize = data2.length;
                            const fileSizeKB = (fileSize / 1024).toFixed(1);
                            log('info', `${req.method} ${pathname} (served as .html, ${fileSizeKB} KB)`);
                            return;
                        }
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>404 - Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        p { color: #666; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    <h1>404 - Not Found</h1>
    <p>The requested file was not found in the production build.</p>
    <p>Requested: <code>${pathname}</code></p>
    <p><a href="/">Go back to home</a></p>
</body>
</html>
                        `);
                        log('warning', `404: ${pathname}`);
                    });
                    return;
                }
                
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>404 - Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        p { color: #666; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    <h1>404 - Not Found</h1>
    <p>The requested file was not found in the production build.</p>
    <p>Requested: <code>${pathname}</code></p>
    <p><a href="/">Go back to home</a></p>
</body>
</html>
                `);
                log('warning', `404: ${pathname}`);
                return;
            }
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache' // Don't cache during testing
            });
            res.end(data);
            
            // Log request
            const fileSize = data.length;
            const fileSizeKB = (fileSize / 1024).toFixed(1);
            log('info', `${req.method} ${pathname} (${fileSizeKB} KB)`);
        });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`\n${colors.bright}${colors.green}🧪 Production Build Test Server${colors.reset}\n`);
    console.log(`${colors.green}✓ Server running${colors.reset}`);
    console.log(`${colors.cyan}📍 Local URL:${colors.reset}   http://localhost:${PORT}`);
    console.log(`${colors.cyan}🌐 Test URL:${colors.reset}    http://127.0.0.1:${PORT}`);
    console.log(`\n${colors.yellow}📂 Serving from:${colors.reset}  ${DIST_DIR}\n`);
    
    console.log(`${colors.bright}Testing Checklist:${colors.reset}`);
    console.log(`  ✓ Homepage loads correctly`);
    console.log(`  ✓ Menu page accessible`);
    console.log(`  ✓ Images display properly`);
    console.log(`  ✓ CSS is minified`);
    console.log(`  ✓ JavaScript works`);
    console.log(`  ✓ Responsive design (test on mobile/tablet)`);
    console.log(`  ✓ Links and navigation work`);
    console.log(`  ✓ Open browser console for errors\n`);
    
    console.log(`${colors.yellow}Stop server:${colors.reset} Press CTRL+C\n`);
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        log('error', `Port ${PORT} is already in use!`);
        console.log(`${colors.yellow}Try:${colors.reset}`);
        console.log(`  1. Close other applications using port ${PORT}`);
        console.log(`  2. Or use: lsof -i :${PORT} (macOS/Linux)`);
        console.log(`  3. Then: kill -9 <PID>\n`);
    } else {
        log('error', err.message);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}🛑 Shutting down server...${colors.reset}`);
    server.close(() => {
        log('success', 'Server stopped');
        console.log('');
        process.exit(0);
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
        log('error', 'Forced shutdown');
        process.exit(1);
    }, 5000);
});

// Handle other errors
process.on('uncaughtException', (err) => {
    log('error', `Uncaught exception: ${err.message}`);
    process.exit(1);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const PORT = 9929;
const uri = "mongodb+srv://vgadi4:Varalakshmi@cluster0.iwoc15u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "bookdb";
const collectionName = "bookcollection";

// Create HTTP server
const server = http.createServer(async (req, res) => {
    console.log(`Request received: ${req.url}`);
    
    try {
        if (req.url === '/') {
            serveStaticFile(res, 'public/index.html', 'text/html');
        }
        else if (req.url === '/api') {
            await serveMongoData(res);
        }
        else if (req.url.match(/\.(html|css|js|png|jpg|jpeg|gif)$/)) {
            // Handle all static files
            const filePath = path.join(__dirname, req.url);
            const contentType = getContentType(req.url);
            serveStaticFile(res, filePath, contentType);
        }
        else {
            serveStaticFile(res, 'public/404.html', 'text/html', 404);
        }
    } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

// Helper function to serve static files
function serveStaticFile(res, filePath, contentType, statusCode = 200) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
        }
        
        res.writeHead(statusCode, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Helper function to determine content type
function getContentType(url) {
    const extname = path.extname(url);
    switch (extname) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'text/javascript';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        default: return 'application/octet-stream';
    }
}

// Helper function to serve MongoDB data
async function serveMongoData(res) {
    let client;
    
    try {
        client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
        
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(data));
    } catch (err) {
        console.error('MongoDB error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database error' }));
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('\nServer shutting down...');
    process.exit();
});
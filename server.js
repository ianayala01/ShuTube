const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use('/media', express.static(path.join(__dirname, 'media'))); // Serve video files statically

// Dynamically read .mp4 files
function getMediaFiles() {
    const mediaRoot = path.join(__dirname, 'media');
    const media = {};

    function walkDir(dir, category) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Use directory name (Movies, tv, etc.) as category
                const subCategory = path.relative(mediaRoot, fullPath).split(path.sep)[0];
                walkDir(fullPath, subCategory);
            } else if (path.extname(file) === '.mp4') {
                const name = path.parse(file).name;
                const relativePath = path.relative(mediaRoot, fullPath).replace(/\\/g, '/'); // ensure POSIX-style
                media[name] = {
                    name: name,
                    filename: relativePath,
                    category: category
                };
            }
        });
    }

    walkDir(mediaRoot, null);
    return media;
}


app.get('/', (req, res) => {
    const media = getMediaFiles();
    res.render('index', { media });
});

app.get('/media/:key', (req, res) => {
    const media = getMediaFiles();
    const item = media[req.params.key];
    if (item) {
        res.render('player', { media: item });
    } else {
        res.status(404).send('Media not found');
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

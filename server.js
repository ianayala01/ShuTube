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
                const subCategory = path.relative(mediaRoot, fullPath).split(path.sep)[0]; // 'Movies' or 'tv'
                walkDir(fullPath, subCategory);
            } else if (path.extname(file) === '.mp4') {
                const name = path.parse(file).name;
                const relativePath = path.relative(mediaRoot, fullPath).replace(/\\/g, '/'); // normalize for URL
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

// Routes
app.get('/', (req, res) => {
    res.render('index'); // Just links to /movies and /tv
});

app.get('/movies', (req, res) => {
    const media = getMediaFiles();
    const movies = Object.values(media).filter(item => item.category === 'Movies');
    res.render('category', { title: 'Movies', media: movies });
});

app.get('/tv', (req, res) => {
    const media = getMediaFiles();
    const tv = Object.values(media).filter(item => item.category === 'tv');
    res.render('category', { title: 'TV Shows', media: tv });
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

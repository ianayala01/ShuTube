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
                // Correctly handle category capitalization (Movies, tv)
                const relative = path.relative(path.join(__dirname, 'media'), fullPath);
                const parts = relative.split(path.sep);
                const topLevelCategory = parts[0].charAt(0).toUpperCase() + parts[0].slice(1); // Capitalize category
                walkDir(fullPath, topLevelCategory); // Keep category consistent
            } else if (path.extname(file) === '.mp4') {
                const name = path.parse(file).name;
                const relativePath = path.relative(path.join(__dirname, 'media'), fullPath).replace(/\\/g, '/');
                media[name] = {
                    name: name,
                    filename: relativePath,
                    category: category // Correctly assign category
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
    res.render('categories', { title: 'Movies', media: movies });
});

app.get('/tv', (req, res) => {
    const media = getMediaFiles();
    const tvShows = Object.values(media).filter(item => item.category === 'Tv');
    res.render('categories', { title: 'TV Shows', media: tv });
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

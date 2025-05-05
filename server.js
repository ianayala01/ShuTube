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
function getTvShows() {
    const tvDir = path.join(__dirname, 'media', 'tv');
    const entries = fs.readdirSync(tvDir, { withFileTypes: true });

    const shows = entries
        .filter(entry => entry.isDirectory())
        .map(entry => ({
            name: entry.name,
            path: `/tv/${encodeURIComponent(entry.name)}`
        }));

    return shows;
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
    const tvShows = getTvShows();
    res.render('tvShows', { title: 'Browse TV Shows', shows: tvShows });
});

app.get('/tv/:showName', (req, res) => {
    const showName = req.params.showName;
    const showDir = path.join(__dirname, 'media', 'tv', showName);

    if (!fs.existsSync(showDir)) {
        return res.status(404).send('TV show not found');
    }

    const entries = fs.readdirSync(showDir, { withFileTypes: true });
    const seasons = entries
        .filter(entry => entry.isDirectory())
        .map(dir => ({
            name: dir.name,
            path: `/tv/${showName}/${dir.name}`
        }));

    // If no subdirs, fall back to showing .mp4 files in show root
    if (seasons.length === 0) {
        const files = entries
            .filter(entry => entry.isFile() && entry.name.endsWith('.mp4'))
            .map(entry => {
                const name = path.parse(entry.name).name;
                const filename = path.join('tv', showName, entry.name).replace(/\\/g, '/');
                return { name, filename };
            });
        return res.render('categories', { title: showName, media: files });
    }

    // Otherwise, render season list as clickable links
    res.render('list', { title: `${showName} Seasons`, items: seasons });
});

app.get('/tv/:showName/:seasonName', (req, res) => {
    const { showName, seasonName } = req.params;
    const seasonDir = path.join(__dirname, 'media', 'tv', showName, seasonName);

    if (!fs.existsSync(seasonDir)) {
        return res.status(404).send('Season not found');
    }

    const files = fs.readdirSync(seasonDir)
        .filter(file => file.endsWith('.mp4'))
        .map(file => {
            const name = path.parse(file).name;
            const filename = path.join('tv', showName, seasonName, file).replace(/\\/g, '/');
            return { name, filename };
        });

    res.render('categories', { title: `${showName} - ${seasonName}`, media: files });
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

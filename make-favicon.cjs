const sharp = require('sharp'); sharp('public/assets/logo.png').resize(128, 128, {fit: 'contain', background: '#2A2421'}).flatten({background: '#2A2421'}).toFile('public/favicon.png');

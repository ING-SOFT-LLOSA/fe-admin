/* eslint-disable */
const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        let pending = list.length;
        if (!pending) return callback(null);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                        const content = fs.readFileSync(file, 'utf8');
                        const newContent = content.replace(/"\/projects/g, '"/proyectos').replace(/`\/projects/g, '`/proyectos');
                        if (content !== newContent) {
                            fs.writeFileSync(file, newContent, 'utf8');
                            console.log('Updated', file);
                        }
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

walk(path.join(__dirname, 'src'), function(err) {
    if (err) throw err;
    console.log('Done');
});

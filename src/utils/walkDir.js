import fs from 'fs';
import path from 'path';

export const walkDir = (dir, extensions) => {
    let results = [];
    const list = fs.readdirSync(dir);

    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results = results.concat(walkDir(filePath, extensions));
        } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
                results.push(filePath);
            }
        }
    }

    return results;
};
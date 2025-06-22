export const walkDir = (dir, mediaExtensions, fileList = []) => {
    if (!fs.existsSync(dir)) return fileList;
    for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath, mediaExtensions, fileList);
        } else if (stat.isFile() && mediaExtensions.includes(path.extname(entry).toLowerCase())) {
            fileList.push(fullPath);
        }
    }
    return fileList;
};
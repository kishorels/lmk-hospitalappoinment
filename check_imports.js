
const fs = require('fs');
const path = require('path');

const file = '/home/user/Documents/react-study/lmk-hospitalappoinment/frontend/app/(user)/appointments.tsx';
const content = fs.readFileSync(file, 'utf8');
const imports = content.match(/from ['"](.*)['"]/g);

console.log('Checking imports in:', file);
imports.forEach(imp => {
    const match = imp.match(/from ['"](.*)['"]/);
    if (match) {
        const moduleName = match[1];
        if (moduleName.startsWith('.')) {
            const absPath = path.resolve(path.dirname(file), moduleName);
            const possiblePaths = [
                absPath + '.tsx',
                absPath + '.ts',
                absPath + '.js',
                absPath + '/index.tsx',
                absPath + '/index.ts',
                absPath + '/index.js',
            ];
            const exists = possiblePaths.some(p => fs.existsSync(p));
            console.log(`${moduleName} -> ${exists ? 'EXISTS' : 'MISSING'}`);
            if (!exists) console.log('  Tried:', possiblePaths);
        } else {
            // Check node_modules
            const nmPath = path.resolve('/home/user/Documents/react-study/lmk-hospitalappoinment/frontend/node_modules', moduleName);
            const exists = fs.existsSync(nmPath);
            console.log(`${moduleName} -> ${exists ? 'INSTALLED' : 'NOT INSTALLED'}`);
        }
    }
});

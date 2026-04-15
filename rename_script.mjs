import fs from 'fs';
import path from 'path';

const replaceInFile = (filePath) => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = content
            .replace(/NullPayHSK/g, 'HashPay')
            .replace(/NullPay/g, 'HashPay')
            .replace(/NULLPAY/g, 'HASHPAY');
            
        if (content !== modified) {
            fs.writeFileSync(filePath, modified);
            console.log(`Updated ${filePath}`);
        }
    } catch(e) {
        console.error(`Error in ${filePath}`, e);
    }
};

const walk = (dir) => {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('cache') && !fullPath.includes('artifacts')) {
                walk(fullPath);
            }
        } else {
            const ext = path.extname(fullPath);
            if (['.js', '.jsx', '.sol', '.md', '.html', '.json', '.css'].includes(ext)) {
                replaceInFile(fullPath);
            }
        }
    });
};

walk('c:/Users/User/.gemini/antigravity/scratch/NullPayHSK');

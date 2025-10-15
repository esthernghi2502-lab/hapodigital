// Create Package Script for HapoDigital Chrome Extension
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class ExtensionPackager {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.buildDir = path.join(this.rootDir, 'build');
        this.distDir = path.join(this.rootDir, 'dist');
        
        // Files and directories to include in package
        this.includePatterns = [
            'manifest.json',
            'popup/**/*',
            'background/**/*',
            'content/**/*',
            'icons/**/*',
            'assets/**/*',
            'README.md'
        ];
        
        // Files to exclude
        this.excludePatterns = [
            'node_modules/**',
            'scripts/**',
            'build/**',
            'dist/**',
            '.git/**',
            '.gitignore',
            'package.json',
            'package-lock.json',
            '*.log',
            '.DS_Store',
            'Thumbs.db'
        ];
    }

    async createPackage() {
        console.log('📦 Creating Chrome Extension package...');
        
        try {
            // Create directories
            await this.createDirectories();
            
            // Get package info
            const packageInfo = this.getPackageInfo();
            
            // Create zip package
            await this.createZipPackage(packageInfo);
            
            console.log('✅ Package created successfully!');
            console.log(`📁 Output: ${path.join(this.distDir, `hapodigital-v${packageInfo.version}.zip`)}`);
            
        } catch (error) {
            console.error('❌ Failed to create package:', error.message);
            process.exit(1);
        }
    }

    async createDirectories() {
        // Create build and dist directories if they don't exist
        if (!fs.existsSync(this.buildDir)) {
            fs.mkdirSync(this.buildDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.distDir)) {
            fs.mkdirSync(this.distDir, { recursive: true });
        }
    }

    getPackageInfo() {
        const manifestPath = path.join(this.rootDir, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            throw new Error('manifest.json not found');
        }
        
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        return {
            name: manifest.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
            version: manifest.version,
            description: manifest.description
        };
    }

    async createZipPackage(packageInfo) {
        const zipPath = path.join(this.distDir, `hapodigital-v${packageInfo.version}.zip`);
        
        // Remove existing zip if it exists
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }
        
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`📊 Package size: ${sizeInMB} MB`);
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Add files to archive
            this.addFilesToArchive(archive);
            
            archive.finalize();
        });
    }

    addFilesToArchive(archive) {
        console.log('📁 Adding files to archive...');
        
        // Add individual files and directories
        const filesToAdd = [
            { src: 'manifest.json', dest: 'manifest.json' },
            { src: 'popup/', dest: 'popup/', isDir: true },
            { src: 'background/', dest: 'background/', isDir: true },
            { src: 'content/', dest: 'content/', isDir: true },
            { src: 'icons/', dest: 'icons/', isDir: true },
            { src: 'assets/', dest: 'assets/', isDir: true },
            { src: 'README.md', dest: 'README.md' }
        ];

        filesToAdd.forEach(file => {
            const srcPath = path.join(this.rootDir, file.src);
            
            if (fs.existsSync(srcPath)) {
                if (file.isDir) {
                    archive.directory(srcPath, file.dest);
                    console.log(`  ✅ Added directory: ${file.src}`);
                } else {
                    archive.file(srcPath, { name: file.dest });
                    console.log(`  ✅ Added file: ${file.src}`);
                }
            } else {
                console.log(`  ⚠️  Skipped (not found): ${file.src}`);
            }
        });

        // Add package info
        const packageInfoContent = JSON.stringify({
            name: "HapoDigital Chrome Extension",
            version: this.getPackageInfo().version,
            build_date: new Date().toISOString(),
            build_by: "HapoDigital Team",
            contact: {
                website: "https://hapodigital.com",
                email: "support@hapodigital.com",
                phone: "0965899745"
            }
        }, null, 2);
        
        archive.append(packageInfoContent, { name: 'package-info.json' });
    }

    // Utility method to check file patterns
    shouldIncludeFile(filePath) {
        const relativePath = path.relative(this.rootDir, filePath);
        
        // Check exclude patterns first
        for (const pattern of this.excludePatterns) {
            if (this.matchPattern(relativePath, pattern)) {
                return false;
            }
        }
        
        // Check include patterns
        for (const pattern of this.includePatterns) {
            if (this.matchPattern(relativePath, pattern)) {
                return true;
            }
        }
        
        return false;
    }

    matchPattern(filePath, pattern) {
        // Simple pattern matching (could be enhanced with proper glob)
        if (pattern.includes('**')) {
            const basePattern = pattern.replace('**/*', '');
            return filePath.startsWith(basePattern);
        } else if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
        } else {
            return filePath === pattern;
        }
    }

    // Method to validate package before creation
    async validatePackage() {
        console.log('🔍 Validating package contents...');
        
        const requiredFiles = [
            'manifest.json',
            'popup/popup.html',
            'popup/popup.js',
            'popup/popup.css',
            'background/background.js',
            'content/content.js',
            'content/content.css'
        ];

        const missingFiles = [];
        
        requiredFiles.forEach(file => {
            const filePath = path.join(this.rootDir, file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(file);
            }
        });

        if (missingFiles.length > 0) {
            throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
        }
        
        console.log('✅ Package validation passed!');
    }
}

// Run packager
if (require.main === module) {
    const packager = new ExtensionPackager();
    
    packager.validatePackage()
        .then(() => packager.createPackage())
        .catch(error => {
            console.error('❌ Package creation failed:', error.message);
            process.exit(1);
        });
}

module.exports = ExtensionPackager;
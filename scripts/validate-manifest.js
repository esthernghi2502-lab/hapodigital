// Validate Manifest Script for HapoDigital Chrome Extension
const fs = require('fs');
const path = require('path');

class ManifestValidator {
    constructor() {
        this.manifestPath = path.join(__dirname, '../manifest.json');
        this.errors = [];
        this.warnings = [];
    }

    validate() {
        console.log('🔍 Validating manifest.json...');
        
        try {
            // Check if manifest exists
            if (!fs.existsSync(this.manifestPath)) {
                this.errors.push('manifest.json file not found');
                return this.showResults();
            }

            // Parse manifest
            const manifestContent = fs.readFileSync(this.manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);

            // Validate required fields
            this.validateRequiredFields(manifest);
            
            // Validate manifest version
            this.validateManifestVersion(manifest);
            
            // Validate permissions
            this.validatePermissions(manifest);
            
            // Validate file references
            this.validateFileReferences(manifest);
            
            // Validate icons
            this.validateIcons(manifest);
            
            // Validate action (popup)
            this.validateAction(manifest);
            
            // Validate background script
            this.validateBackground(manifest);
            
            // Validate content scripts
            this.validateContentScripts(manifest);

            this.showResults();

        } catch (error) {
            this.errors.push(`Failed to parse manifest.json: ${error.message}`);
            this.showResults();
        }
    }

    validateRequiredFields(manifest) {
        const required = ['manifest_version', 'name', 'version'];
        
        required.forEach(field => {
            if (!manifest[field]) {
                this.errors.push(`Missing required field: ${field}`);
            }
        });

        if (manifest.name && manifest.name.length > 75) {
            this.warnings.push('Extension name is longer than 75 characters');
        }

        if (manifest.description && manifest.description.length > 132) {
            this.warnings.push('Description is longer than 132 characters');
        }
    }

    validateManifestVersion(manifest) {
        if (manifest.manifest_version !== 3) {
            this.errors.push('This extension requires Manifest V3');
        }
    }

    validatePermissions(manifest) {
        const permissions = manifest.permissions || [];
        const hostPermissions = manifest.host_permissions || [];

        // Check for deprecated permissions
        const deprecated = ['background', 'tabs'];
        permissions.forEach(permission => {
            if (permission === 'tabs' && !manifest.host_permissions) {
                this.warnings.push('tabs permission without host_permissions may not work as expected');
            }
        });

        // Validate host permissions format
        hostPermissions.forEach(host => {
            if (!host.startsWith('http://') && !host.startsWith('https://') && host !== '<all_urls>') {
                this.warnings.push(`Invalid host permission format: ${host}`);
            }
        });
    }

    validateFileReferences(manifest) {
        const filesToCheck = [];

        // Collect all file references
        if (manifest.action && manifest.action.default_popup) {
            filesToCheck.push(manifest.action.default_popup);
        }

        if (manifest.background && manifest.background.service_worker) {
            filesToCheck.push(manifest.background.service_worker);
        }

        if (manifest.content_scripts) {
            manifest.content_scripts.forEach(script => {
                if (script.js) {
                    filesToCheck.push(...script.js);
                }
                if (script.css) {
                    filesToCheck.push(...script.css);
                }
            });
        }

        if (manifest.icons) {
            Object.values(manifest.icons).forEach(iconPath => {
                filesToCheck.push(iconPath);
            });
        }

        // Check if files exist
        filesToCheck.forEach(filePath => {
            const fullPath = path.join(path.dirname(this.manifestPath), filePath);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`Referenced file not found: ${filePath}`);
            }
        });
    }

    validateIcons(manifest) {
        if (!manifest.icons) {
            this.warnings.push('No icons specified');
            return;
        }

        const recommendedSizes = [16, 32, 48, 128];
        const providedSizes = Object.keys(manifest.icons).map(size => parseInt(size));

        recommendedSizes.forEach(size => {
            if (!providedSizes.includes(size)) {
                this.warnings.push(`Missing recommended icon size: ${size}x${size}`);
            }
        });
    }

    validateAction(manifest) {
        if (!manifest.action) {
            this.warnings.push('No action (popup/badge) defined');
            return;
        }

        if (!manifest.action.default_popup) {
            this.warnings.push('No default popup specified');
        }

        if (!manifest.action.default_icon) {
            this.warnings.push('No default icon for action');
        }
    }

    validateBackground(manifest) {
        if (!manifest.background) {
            this.warnings.push('No background script specified');
            return;
        }

        if (!manifest.background.service_worker) {
            this.errors.push('Manifest V3 requires service_worker instead of scripts');
        }

        if (manifest.background.persistent !== undefined) {
            this.warnings.push('persistent field is ignored in Manifest V3');
        }
    }

    validateContentScripts(manifest) {
        if (!manifest.content_scripts || manifest.content_scripts.length === 0) {
            this.warnings.push('No content scripts defined');
            return;
        }

        manifest.content_scripts.forEach((script, index) => {
            if (!script.matches || script.matches.length === 0) {
                this.errors.push(`Content script ${index} has no matches`);
            }

            if (!script.js && !script.css) {
                this.warnings.push(`Content script ${index} has no JS or CSS files`);
            }
        });
    }

    showResults() {
        console.log('\n📋 Validation Results:');
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ Manifest validation passed! No issues found.');
            process.exit(0);
        }

        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => {
                console.log(`  • ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach(warning => {
                console.log(`  • ${warning}`);
            });
        }

        console.log(`\n📊 Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`);

        if (this.errors.length > 0) {
            console.log('\n❌ Validation failed! Please fix the errors above.');
            process.exit(1);
        } else {
            console.log('\n✅ Validation passed with warnings.');
            process.exit(0);
        }
    }
}

// Run validation
if (require.main === module) {
    const validator = new ManifestValidator();
    validator.validate();
}

module.exports = ManifestValidator;
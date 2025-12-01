const { withAndroidManifest, withDangerousMod, withPlugins, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAppMonitorPermissions = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        // Add permissions
        if (!androidManifest.manifest['uses-permission']) {
            androidManifest.manifest['uses-permission'] = [];
        }

        const permissions = [
            'android.permission.FOREGROUND_SERVICE',
            'android.permission.FOREGROUND_SERVICE_DATA_SYNC' // For Android 14+
        ];

        permissions.forEach(permission => {
            if (!androidManifest.manifest['uses-permission'].some(p => p.$['android:name'] === permission)) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': permission }
                });
            }
        });

        // Add service
        const mainApplication = androidManifest.manifest.application[0];
        if (!mainApplication.service) {
            mainApplication.service = [];
        }

        if (!mainApplication.service.some(s => s.$['android:name'] === '.AppMonitorService')) {
            mainApplication.service.push({
                $: {
                    'android:name': '.AppMonitorService',
                    'android:foregroundServiceType': 'dataSync',
                    'android:exported': 'false'
                }
            });
        }

        return config;
    });
};

const withAppMonitorFiles = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const androidSrcDir = path.join(
                projectRoot,
                'android/app/src/main/java/com/horrorreaper/SuperSelfMobile'
            );

            // Ensure directory exists (it should, but safety first)
            if (fs.existsSync(androidSrcDir)) {
                // Copy AppMonitorService.kt
                const serviceSrc = path.join(projectRoot, 'plugins/AppMonitorService.kt');
                const serviceDest = path.join(androidSrcDir, 'AppMonitorService.kt');
                if (fs.existsSync(serviceSrc)) {
                    fs.copyFileSync(serviceSrc, serviceDest);
                }

                // Copy AppMonitorModule.kt (overwriting existing)
                const moduleSrc = path.join(projectRoot, 'plugins/AppMonitorModule.kt');
                const moduleDest = path.join(androidSrcDir, 'AppMonitorModule.kt');
                if (fs.existsSync(moduleSrc)) {
                    fs.copyFileSync(moduleSrc, moduleDest);
                }

                // Copy AppMonitorPackage.kt
                const packageSrc = path.join(projectRoot, 'plugins/AppMonitorPackage.kt');
                const packageDest = path.join(androidSrcDir, 'AppMonitorPackage.kt');
                if (fs.existsSync(packageSrc)) {
                    fs.copyFileSync(packageSrc, packageDest);
                }
            }

            return config;
        },
    ]);
};

const withAppMonitorPackage = (config) => {
    return withMainApplication(config, (config) => {
        let mainApplication = config.modResults.contents;

        // Check if package is already added
        if (!mainApplication.includes('packages.add(AppMonitorPackage())')) {
            // Find the place to add the package
            // Usually inside getPackages()
            const search = 'val packages = PackageList(this).packages';
            const replace = `${search}\n        packages.add(AppMonitorPackage())`;

            if (mainApplication.includes(search)) {
                mainApplication = mainApplication.replace(search, replace);
            } else {
                // Fallback for different MainApplication structures
                // Try to find return packages
                const searchReturn = 'return packages';
                const replaceReturn = 'packages.add(AppMonitorPackage())\n        return packages';
                if (mainApplication.includes(searchReturn)) {
                    mainApplication = mainApplication.replace(searchReturn, replaceReturn);
                }
            }
        }

        config.modResults.contents = mainApplication;
        return config;
    });
};

const withAppMonitor = (config) => {
    return withPlugins(config, [
        withAppMonitorPermissions,
        withAppMonitorFiles,
        withAppMonitorPackage,
    ]);
};

module.exports = withAppMonitor;

const { withAndroidManifest, withDangerousMod, withPlugins } = require('@expo/config-plugins');
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
            }

            return config;
        },
    ]);
};

const withAppMonitor = (config) => {
    return withPlugins(config, [
        withAppMonitorPermissions,
        withAppMonitorFiles,
    ]);
};

module.exports = withAppMonitor;

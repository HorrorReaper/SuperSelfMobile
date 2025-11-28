package com.horrorreaper.SuperSelfMobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat

class AppMonitorService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private val checkInterval = 1000L // 1 second

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            startForegroundService()
            checkForegroundApp()
        }
        return START_STICKY
    }

    private fun startForegroundService() {
        val channelId = "AppMonitorChannel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "App Monitor Service",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("SuperSelf Monitor")
            .setContentText("Monitoring app usage...")
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Using system icon to be safe
            .build()

        startForeground(1, notification)
    }

    private fun checkForegroundApp() {
        if (!isRunning) return

        // Here we would ideally check the foreground app and launch the main activity if blocked.
        // However, since the actual detection logic is in JS (via the native module),
        // this service's main purpose is to keep the app process alive.
        // The JS side (appMonitor2.ts) uses setInterval which should now keep running
        // because the process is in the foreground state.

        handler.postDelayed({ checkForegroundApp() }, checkInterval)
    }

    override fun onDestroy() {
        isRunning = false
        super.onDestroy()
    }
}

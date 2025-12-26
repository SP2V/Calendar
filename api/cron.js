import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// You will set these env vars in Vercel Dashboard
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();
const messaging = getMessaging();

export default async function handler(request, response) {
    // Only allow POST requests (Vercel Cron sends GET by default, but we can accept GET too)
    // Secure it: Vercel sends a header 'Authorization' with 'Bearer <CRON_SECRET>' if configured
    // For simplicity now, we just run.

    try {
        const now = new Date();
        // Use Thailand Time
        const timeString = now.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        });

        console.log(`[Cron] Checking alarms for: ${timeString}`);

        // Query 'customNotifications'
        const snapshot = await db.collection('customNotifications')
            .where('isEnabled', '==', true)
            .where('time', '==', timeString)
            .get();

        if (snapshot.empty) {
            console.log('No alarms found.');
            return response.status(200).json({ message: 'No alarms found', time: timeString });
        }

        const promises = [];
        let successCount = 0;

        for (const doc of snapshot.docs) {
            const note = doc.data();
            const uid = note.uid;

            if (!uid) continue;

            // Get User's FCM Token
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists || !userDoc.data().fcmToken) {
                console.log(`User ${uid} has no FCM token.`);
                continue;
            }

            const token = userDoc.data().fcmToken;

            // Send Push
            const message = {
                token: token,
                notification: {
                    title: note.title || 'Notification',
                    body: `ถึงเวลา ${note.time} แล้ว`
                },
                webpush: {
                    fcm_options: {
                        link: '/'
                    }
                }
            };

            promises.push(
                messaging.send(message)
                    .then(() => { successCount++; })
                    .catch(e => console.error('Error sending message:', e))
            );
        }

        await Promise.all(promises);

        console.log(`Sent ${successCount} notifications.`);
        return response.status(200).json({
            success: true,
            sent: successCount,
            time: timeString
        });

    } catch (error) {
        console.error('Cron error:', error);
        return response.status(500).json({ error: error.message });
    }
}

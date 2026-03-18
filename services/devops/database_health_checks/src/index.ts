import * as ff from '@google-cloud/functions-framework';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { MetricServiceClient } from '@google-cloud/monitoring';

admin.initializeApp();
const db = admin.firestore();
const monitoringClient = new MetricServiceClient();

ff.cloudEvent('checkFirestoreHealth', async (cloudEvent: any) => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';
  const projectPath = monitoringClient.projectPath(projectId);

  try {
    // 1. Fetch Metrics
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - 3600;

    const [latencySeries] = await monitoringClient.listTimeSeries({
      name: projectPath,
      filter: 'metric.type = "firestore.googleapis.com/api/request_latencies"',
      interval: { startTime: { seconds: startTime }, endTime: { seconds: endTime } },
    });

    // 1. Get the raw mean in seconds (e.g., 0.035)
    const rawMeanSeconds = latencySeries[0]?.points?.[0]?.value?.distributionValue?.mean || 0;

    const avgLatency = Math.round(rawMeanSeconds * 1000);

    // 2. Active User Count
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const userSnapshot = await db.collection("users").where("lastActive", ">=", oneHourAgo).count().get();
    const activeUsers = userSnapshot.data().count;

    // 3. Update Firestore
    const status = avgLatency > 500 ? 'down' : (avgLatency > 200 ? 'degraded' : 'healthy');

    await db.collection("admin_metrics").doc("app_status").set({
      status,
      avgLatencyMs: Math.round(avgLatency),
      activeUsers,
      lastCheck: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Gmail Notification (using Secret Manager environment variable)
    if (status !== 'healthy') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'cansattool@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: 'Health Monitor',
        to: 'chanraksmeylay17@gmail.com',
        subject: `Database Status: ${status}`,
        text: `Latency is ${Math.round(avgLatency)}ms with ${activeUsers} active users.`
      });
    }

    console.log(`Health check logged: ${status}`);
  } catch (err) {
    console.error('Error in health check:', err);
  }
});
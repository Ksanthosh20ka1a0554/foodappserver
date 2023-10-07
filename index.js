const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = 'i-have-food-e4a0d-firebase-adminsdk-w1f1j-d737c84b53.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://i-have-food-e4a0d-default-rtdb.asia-southeast1.firebasedatabase.app"
});


const db = admin.database();
const app = express();
const port = process.env.PORT || 7000;

app.use(express.json());


async function sendNotifications(currentUserId) {
    try {
        const fcmTokensRef = db.ref('FCMTokens');
        const tokensSnapshot = await fcmTokensRef.once('value');
        const tokens = tokensSnapshot.val();

        if (!tokens) {
            console.log('No FCM tokens found');
            return;
        }

        const otherUserTokens = Object.entries(tokens)
            .filter(([userId]) => userId !== currentUserId)
            .map(([_, token]) => token);

        if (otherUserTokens.length === 0) {
            console.log('No other user tokens found');
            return;
        }

        // Log each FCM token one by one
        for (const token of otherUserTokens) {
            await sendFCMNotification(token);
        }

        console.log('Notifications sent successfully');
    } catch (error) {
        console.error('Error:', error.message);
    }
}




app.post('/foodLocationChangeRequest', (req, res) => {
    const currentUserId = req.body.userId;
    sendNotifications(currentUserId);
});

function sendFCMNotification(deviceFcmToken) {
    const message = {
        data: {
            title: 'New Food Donation',
            body: 'There is a new food donation available near you.'
        },
        token: deviceFcmToken
    };

    admin.messaging().send(message)
        .then(response => {
            console.log('Successfully sent FCM message:', response);
        })
        .catch(error => {
            console.error('Error sending FCM message:', error);
            // Propagate the error to be caught by the calling function
            throw error;
        });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

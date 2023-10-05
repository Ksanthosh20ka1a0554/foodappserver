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

app.post('/foodLocationChangeRequest', (req, res) => {
    const currentUserId = req.body.userId;

    const fcmTokensRef = db.ref('FCMTokens');
    fcmTokensRef.once('value')
        .then(tokensSnapshot => {
            const promises = [];

            tokensSnapshot.forEach(tokenSnapshot => {
                const deviceFcmToken = tokenSnapshot.val();
                const promise = sendFCMNotification(deviceFcmToken);
                promises.push(promise);
            });

            // Wait for all promises to resolve
            Promise.all(promises)
                .then(() => {
                    res.status(200).send('Food location updated and notifications sent');
                })
                .catch(error => {
                    console.error('Error sending FCM messages:', error.message);
                    res.status(500).send('Internal Server Error');
                });
        })
        .catch(error => {
            console.error('Error fetching FCM tokens:', error.message);
            res.status(500).send('Internal Server Error');
        });
});

function sendFCMNotification(deviceFcmToken) {
    const message = {
        data: {
            title: 'New Food Donation',
            body: 'There is a new food donation available near you.'
        },
        token: deviceFcmToken
    };

    // Return the promise
    return admin.messaging().send(message)
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

const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = 'i-have-food-e4a0d-firebase-adminsdk-w1f1j-d737c84b53.json';


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://i-have-food-e4a0d-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

const app = express();
const port = process.env.PORT || 7000; // Change this to your desired port

app.use(express.json());

app.post('/foodLocationChangeRequest', (req, res) => {
    var currentUserId = req.body.userId;

    // Fetch FCM tokens from FCMTokens child
    const fcmTokensRef = db.ref('FCMTokens');
    fcmTokensRef.once('value')
        .then(tokensSnapshot => {
            tokensSnapshot.forEach(tokenSnapshot => {
                var deviceFcmToken = tokenSnapshot.val(); // Assuming each child node under FCMTokens is a token
                sendFCMNotification(deviceFcmToken);
                // Skip sending notification to the current user
                // if (tokenSnapshot.key !== currentUserId) {
                    
                // }
            });

            res.status(200).send('Food location updated and notifications sent');
        })
        .catch(error => {
            console.error('Error fetching FCM tokens:', error.message);
            res.status(500).send('Internal Server Error');
        });
});

function sendFCMNotification(deviceFcmToken) {
    var message = {
        data: {
            title: 'New Food Donation',
            body: 'There is a new food donation available near you.'
        },
        token: deviceFcmToken
    };

    admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent FCM message:', response);
        })
        .catch((error) => {
            console.error('Error sending FCM message:', error);
        });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

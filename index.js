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
            await sendFCMNotification(token,'New Food Donation','There is a new food donation available near you.','');
        }

        console.log('Notifications sent successfully');
    } catch (error) {
        console.error('Error:', error.message);
    }
}


app.post('/foodAccept', (req, res) => {
    const toUserId = req.body.toUserId;
    const currUserId = req.body.userId;
    sendAcceptanceNotification(toUserId,currUserId);
    res.status(200).json({ message: 'Notification sent successfully.' });
});

app.post('/foodLocationChangeRequest', (req, res) => {
    const currentUserId = req.body.userId;
    sendNotifications(currentUserId);
});

app.post('/messageNotification', (req, res) => {
    const currentUserId = req.body.userId;
    const toUserId = req.body.toUserId;
    const message = req.body.message;
    sendMessageNotification(currentUserId,toUserId,message);
});

async function sendMessageNotification(currUserId,toUserId,message) {
    try {
        const fcmTokensRef = db.ref('FCMTokens');
        const tokensSnapshot = await fcmTokensRef.once('value');
        const tokens = tokensSnapshot.val();

        if (!tokens) {
            console.log('No FCM tokens found');
            return;
        }

        const toUserToken = tokens[toUserId];

        if (!toUserToken) {
            console.log('Token not found for the accepted user');
            return;
        }

        // Send notification to the accepted user
                await sendFCMNotification(toUserToken, 'New Message', "From ${currUserId} :${message}", currUserId);

        console.log('Message notification sent successfully');
    } catch (error) {
        console.error('Error:', error.message);
    }
}


async function sendAcceptanceNotification(toUserId,currUserId) {
    try {
        const fcmTokensRef = db.ref('FCMTokens');
        const tokensSnapshot = await fcmTokensRef.once('value');
        const tokens = tokensSnapshot.val();

        if (!tokens) {
            console.log('No FCM tokens found');
            return;
        }

        const toUserToken = tokens[toUserId];

        if (!toUserToken) {
            console.log('Token not found for the accepted user');
            return;
        }

        // Send notification to the accepted user
        await sendFCMNotification(toUserToken, 'Food Acceptance Request', 'Your Food donation has been requested by someone.',currUserId);

        console.log('Acceptance notification sent successfully');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function sendFCMNotification(deviceFcmToken,title,body,currUserId) {
    let message;
    if(currUserId==''){
        message = {
        data: {
            title: title ,
            body: body
        },
        token: deviceFcmToken
    };
    }
    else if(title=="New Message"){
       message = {
        data: {
            title: title ,
            body: body,
            messagedUserId: currUserId
        },
        token: deviceFcmToken
    }; 
    }
    else{
       message = {
        data: {
            title: title ,
            body: body,
            acceptedUserId: currUserId
        },
        token: deviceFcmToken
    }; 
    }
    

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

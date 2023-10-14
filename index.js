const express = require('express');
const app = express();
const port = process.env.PORT || 7000;

app.use(express.json());

app.post('/foodLocationChangeRequest', (req, res) => {
    const requestData = req.body;

    // Log the entire request body
    console.log('Request parameters received:', requestData);

    // Send a response to the client
    res.status(200).send('Parameters logged successfully.');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

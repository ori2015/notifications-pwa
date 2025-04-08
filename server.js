const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const app = express();

// הגדרת CORS כדי לאפשר גישה מהאתר שלנו
app.use(cors());
app.use(express.json());

// מפתחות VAPID - צריך להחליף אותם במפתחות אמיתיים
const vapidKeys = {
    publicKey: 'BLA0UOxKL6KnuGvpoTaNYfSBJ-3RWImC2TRB8LSll8_FjN_RAiR-ZBokngYXYQ0XUnJPJEJJJa-IBIy8xTlIF8k',
    privateKey: 'l6DZ-L9skC_dAixy7dIZKCp25lwOzJb-puRqVLvhkHY'
};

webpush.setVapidDetails(
    'mailto:example@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// מאגר זמני של מנויים (במערכת אמיתית זה יהיה במסד נתונים)
let subscriptions = [];

// נקודת קצה להצגת דף הסבר על ההרשמה
app.get('/subscribe', (req, res) => {
    res.send(`
        <html dir="rtl">
        <head>
            <title>הרשמה להתראות</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    line-height: 1.6;
                }
                .container {
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 20px;
                }
                h1 {
                    color: #333;
                    margin-bottom: 20px;
                }
                .steps {
                    margin-top: 20px;
                }
                .step {
                    margin-bottom: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>הרשמה להתראות</h1>
                <p>כדי להירשם להתראות, עליך לבצע את הצעדים הבאים:</p>
                <div class="steps">
                    <div class="step">1. פתח את האתר הראשי: <a href="https://ori2015.github.io/notifications-pwa/">https://ori2015.github.io/notifications-pwa/</a></div>
                    <div class="step">2. לחץ על כפתור "הרשמה להתראות"</div>
                    <div class="step">3. אשר את בקשת ההרשאה להתראות בדפדפן</div>
                </div>
                <p>לאחר ההרשמה תוכל לקבל התראות מהמערכת.</p>
            </div>
        </body>
        </html>
    `);
});

// נקודת קצה להרשמה להתראות
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({});
    console.log('נרשם חדש:', subscription);
});

// נקודת קצה לשליחת התראה לכל המנויים
app.post('/send-notification', async (req, res) => {
    const notification = {
        title: req.body.title || 'הודעה חדשה',
        body: req.body.body || 'תוכן ההודעה',
        url: req.body.url || 'https://ori2015.github.io/notifications-pwa/'
    };

    console.log('מנסה לשלוח התראה:', notification);
    console.log('מספר מנויים:', subscriptions.length);

    const promises = subscriptions.map(subscription => {
        console.log('שולח התראה למנוי:', subscription.endpoint);
        return webpush.sendNotification(subscription, JSON.stringify(notification))
            .then(() => {
                console.log('התראה נשלחה בהצלחה ל:', subscription.endpoint);
            })
            .catch(err => {
                console.error('שגיאה בשליחת התראה ל:', subscription.endpoint, err);
                if (err.statusCode === 410) {
                    console.log('מסיר מנוי לא תקף:', subscription.endpoint);
                    subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
                }
            });
    });

    try {
        await Promise.all(promises);
        console.log('כל ההתראות נשלחו בהצלחה');
        res.json({ message: 'ההתראות נשלחו בהצלחה' });
    } catch (error) {
        console.error('שגיאה בשליחת התראות:', error);
        res.status(500).json({ error: 'שגיאה בשליחת ההתראות' });
    }
});

// הוספת נקודת קצה GET לשליחת התראות
app.get('/send-notification', (req, res) => {
    res.send(`
        <html dir="rtl">
        <head>
            <title>שליחת התראה</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                }
                input[type="text"], textarea {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 10px;
                }
                button {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #45a049;
                }
            </style>
        </head>
        <body>
            <h1>שליחת התראה</h1>
            <form id="notificationForm">
                <div class="form-group">
                    <label for="title">כותרת:</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="body">תוכן ההודעה:</label>
                    <textarea id="body" name="body" required></textarea>
                </div>
                <div class="form-group">
                    <label for="url">קישור (אופציונלי):</label>
                    <input type="text" id="url" name="url" value="https://ori2015.github.io/notifications-pwa/">
                </div>
                <button type="submit">שלח התראה</button>
            </form>
            <script>
                document.getElementById('notificationForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = {
                        title: document.getElementById('title').value,
                        body: document.getElementById('body').value,
                        url: document.getElementById('url').value
                    };
                    try {
                        const response = await fetch('/send-notification', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(formData)
                        });
                        const result = await response.json();
                        alert(result.message || 'ההתראה נשלחה בהצלחה!');
                    } catch (error) {
                        alert('שגיאה בשליחת ההתראה: ' + error);
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// נקודת קצה להצגת המנויים הרשומים
app.get('/subscriptions', (req, res) => {
    res.json({
        subscribersCount: subscriptions.length,
        subscribers: subscriptions
    });
});

const port = process.env.PORT || 3000;
const sslPort = process.env.SSL_PORT || 3443;

// הפעלת שרת HTTP
http.createServer(app).listen(port, () => {
    console.log(`שרת HTTP פועל בפורט ${port}`);
});

// בדיקה אם יש קבצי SSL
try {
    // נסה להפעיל שרת HTTPS עם קבצי SSL החדשים
    if (fs.existsSync(path.join(__dirname, 'cert.key')) && fs.existsSync(path.join(__dirname, 'cert.crt'))) {
        const options = {
            key: fs.readFileSync(path.join(__dirname, 'cert.key')),
            cert: fs.readFileSync(path.join(__dirname, 'cert.crt'))
        };
        
        // הפעלת שרת HTTPS
        https.createServer(options, app).listen(sslPort, () => {
            console.log(`שרת HTTPS פועל בפורט ${sslPort}`);
            console.log(`כדי להשתמש בהתראות באייפון, השתמש ב-https://localhost:${sslPort}`);
        });
    } else {
        console.log('לא נמצאו קבצי SSL. השרת פועל רק עם HTTP.');
        console.log('כדי להפעיל את השרת עם HTTPS (נדרש לאייפון), צור קבצי SSL עם mkcert');
    }
} catch (err) {
    console.error('שגיאה בהפעלת שרת HTTPS:', err);
} 
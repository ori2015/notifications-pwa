// רישום Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', {
            scope: '/notifications-pwa/'
        })
            .then(registration => {
                console.log('Service Worker נרשם בהצלחה:', registration);
            })
            .catch(error => {
                console.log('רישום Service Worker נכשל:', error);
            });
    });
}

// מפתח VAPID ציבורי - צריך להחליף את זה במפתח אמיתי
const publicVapidKey = 'BLA0UOxKL6KnuGvpoTaNYfSBJ-3RWImC2TRB8LSll8_FjN_RAiR-ZBokngYXYQ0XUnJPJEJJJa-IBIy8xTlIF8k';

// פונקציה להרשמה להתראות
async function subscribeUserToPush(registration) {
    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
        
        console.log('נרשם בהצלחה:', subscription);
        
        // שליחת המידע לשרת
        let serverUrl = '';
        
        // בדיקה אם האפליקציה רצה מטלפון
        if (window.location.hostname === 'ori2015.github.io' || isIOS()) {
            // כשהאתר רץ מהגיטהאב או כשזה אייפון
            serverUrl = 'https://localhost:3443/subscribe';
        } else {
            // כשהאתר רץ מהמחשב המקומי
            serverUrl = 'http://localhost:3000/subscribe';
        }
        
        await fetch(serverUrl, {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        return subscription;
    } catch (err) {
        console.error('שגיאה בהרשמה להתראות:', err);
        throw err;
    }
}

// המרת מפתח VAPID למערך בתים
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// פונקציה לבדיקה אם המכשיר הוא iOS
function isIOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

const subscribeButton = document.getElementById('subscribe');
const sendButton = document.getElementById('send-notification');

// בקשת הרשאה להתראות
subscribeButton.addEventListener('click', async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            if (isIOS()) {
                // באייפון אנחנו נציג התראות מקומיות בלבד
                alert('התראות מוגדרות! במכשירי iOS, אנו משתמשים בהתראות מקומיות בלבד.');
            } else {
                // מכשירים אחרים יכולים להשתמש ב-Push API
                const registration = await navigator.serviceWorker.ready;
                await subscribeUserToPush(registration);
                alert('נרשמת בהצלחה להתראות!');
            }
        } else {
            alert('לא ניתנה הרשאה להתראות');
        }
    } catch (error) {
        console.error('שגיאה בבקשת הרשאה להתראות:', error);
        alert('שגיאה בהרשמה להתראות. וודא שאתה משתמש בחיבור HTTPS');
    }
});

// שליחת התראת בדיקה
sendButton.addEventListener('click', async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('הודעת בדיקה', {
            body: 'זוהי הודעת בדיקה מהמערכת',
            icon: './apple-touch-icon.png',
            badge: './apple-touch-icon.png'
        });
    } catch (error) {
        console.error('שגיאה בשליחת התראה:', error);
        
        // לאייפון, ננסה להשתמש בהתראה מקומית
        if (isIOS() && 'Notification' in window) {
            new Notification('הודעת בדיקה', {
                body: 'זוהי הודעת בדיקה מהמערכת',
                icon: './apple-touch-icon.png'
            });
        } else {
            alert('שגיאה בשליחת התראה. וודא שאתה משתמש בחיבור HTTPS ושאישרת קבלת התראות');
        }
    }
}); 
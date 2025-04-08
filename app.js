// רישום Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker נרשם בהצלחה:', registration);
            })
            .catch(error => {
                console.log('רישום Service Worker נכשל:', error);
            });
    });
}

// בדיקה אם הדפדפן תומך בהתראות
const checkNotificationSupport = () => {
    if (!('Notification' in window)) {
        alert('הדפדפן שלך לא תומך בהתראות');
        return false;
    }
    return true;
};

const subscribeButton = document.getElementById('subscribe');
const sendButton = document.getElementById('send-notification');

// בקשת הרשאה להתראות
subscribeButton.addEventListener('click', async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            alert('נרשמת בהצלחה להתראות!');
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
            icon: 'apple-touch-icon.png',
            badge: 'apple-touch-icon.png'
        });
    } catch (error) {
        console.error('שגיאה בשליחת התראה:', error);
        alert('שגיאה בשליחת התראה. וודא שאתה משתמש בחיבור HTTPS ושאישרת קבלת התראות');
    }
}); 
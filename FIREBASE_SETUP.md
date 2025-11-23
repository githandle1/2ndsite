# Firebase Setup for Stoccato Notes

To enable shared notes that everyone can see, you need to set up Firebase Firestore.

## Steps:

1. **Create a Firebase Project**
   - Go to https://console.firebase.google.com/
   - Click "Add project" or select an existing project
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In your Firebase project, go to "Firestore Database"
   - Click "Create database"
   - Start in **test mode** (for development) or set up security rules for production
   - Choose a location for your database

3. **Get Your Firebase Config**
   - In Firebase Console, go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Register your app and copy the `firebaseConfig` object

4. **Update stoccato.html**
   - Open `stoccato.html`
   - Find the `firebaseConfig` object (around line 19-26)
   - Replace the placeholder values with your actual Firebase config:
     ```javascript
     const firebaseConfig = {
         apiKey: "YOUR_ACTUAL_API_KEY",
         authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
         projectId: "YOUR_ACTUAL_PROJECT_ID",
         storageBucket: "YOUR_PROJECT_ID.appspot.com",
         messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
         appId: "YOUR_ACTUAL_APP_ID"
     };
     ```

5. **Set Up Firestore Security Rules (Important!)**
   - In Firebase Console, go to Firestore Database > Rules
   - For development/testing, you can use:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /stoccato-notes/{document=**} {
           allow read, write: if true;
         }
       }
     }
     ```
   - **For production**, set up proper security rules to prevent abuse

6. **Test It**
   - Open `stoccato.html` in your browser
   - Create a note - it should save to Firebase
   - Open the same page in another browser/device - you should see the same notes!

## Notes:
- If Firebase is not configured, the app will fall back to localStorage (notes only visible to that browser)
- All notes are shared in real-time across all visitors
- Notes are automatically saved when created, edited, or moved
- The free tier of Firebase should be sufficient for most use cases


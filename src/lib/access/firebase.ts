// Your web app's Firebase configuration

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyB9GHaiw7ZU30OCMpEsTsqgnF2WNiFbQTg',
	authDomain: 'brodo-3e8bb.firebaseapp.com',
	projectId: 'brodo-3e8bb',
	storageBucket: 'brodo-3e8bb.appspot.com',
	messagingSenderId: '97112159617',
	appId: '1:97112159617:web:f60a82bf5a49b5c9376480',
	measurementId: 'G-B6HELL6SCX'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const firebase = {
	app,
	auth: getAuth(app)
};

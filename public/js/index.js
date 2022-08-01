import '@babel/polyfill';
import{login, logOut} from './login';
import {displayMap} from './mapbox'
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login')
const logOutBtn  = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour')

if(mapBox){
    const locations = JSON.parse(mapBox.dataset.locations)
    
    displayMap(locations);
}

if(loginForm){
    loginForm.addEventListener('submit', event => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    })
}

if(logOutBtn){
    console.log(logOutBtn);
    logOutBtn.addEventListener('click', logOut);
}

if(userDataForm){
    userDataForm.addEventListener('submit', event => {
        event.preventDefault();
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        updateSettings(form,'data');
    })
}

if(userPasswordForm) {
    userPasswordForm.addEventListener('submit', async event => {
        event.preventDefault();
        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        await updateSettings({passwordCurrent, password, passwordConfirm},'password');

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';

    })
}

if(bookBtn){
    bookBtn.addEventListener('click', event => {
        e.target.textContent = 'Processing...';
        const {tourId} = event.target.dataset.tourId;
        bookTour(tourId);
    })
}
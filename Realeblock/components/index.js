const signInForm = document.querySelector('.sign-in-form');
const signUpForm = document.querySelector('.sign-up-form');

signInForm.addEventListener('submit', (event) => {
  event.preventDefault();

  // Send sign-in data to server or handle authentication here

  alert('Successfully signed in!');
});

signUpForm.addEventListener('submit', (event) => {
  event.preventDefault();

  // Send sign-up data to server or handle registration here

  alert('Successfully signed up!');
});

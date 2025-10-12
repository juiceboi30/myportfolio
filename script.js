// script.js
document.querySelector('.burger').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('active');
});

// Smooth scroll for nav links
document.querySelectorAll('nav .nav-links a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector('.nav-links').classList.remove('active');
    const target = document.querySelector(this.getAttribute('href'));
    window.scrollTo({
      top: target.offsetTop - 68,
      behavior: 'smooth'
    });
  });
});

document.getElementById('contact-form').addEventListener('submit', function(e){
  document.getElementById('form-msg').textContent = "Sending...";
});


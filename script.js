document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('captcha-checkbox');
    const popup = document.getElementById('popup');
    const closePopup = document.getElementById('close-popup');
    const submitCaptcha = document.getElementById('submit-captcha');
    const resultMessage = document.getElementById('result-message');
    const optionContainer = document.getElementById('option-container');
    const referenceImage = document.getElementById('reference-image');
    const submitBtn = document.getElementById('submitBtn');

    let attemptCount = 0;
    const maxAttempts = 2;
    const images = [
        'a1.jpg', 'a2.jpg', 'a3.jpg', 'a4.jpg', 'a5.jpg', 'a6.jpg', 'a7.jpg', 'a8.jpg', 'a9.jpg', 'a10.jpg', 'a11.jpg', 'a12.jpg', 'a13.jpg', 'a14.jpg'
    ];

    function setupCaptcha() {
        optionContainer.innerHTML = '';
        const shuffledImages = [...images].sort(() => 0.5 - Math.random());
        const referenceIndex = Math.floor(Math.random() * 3);
        const correctImage = shuffledImages[referenceIndex];
        referenceImage.style.backgroundImage = `url(${correctImage})`;

        shuffledImages.slice(0, 3).forEach((img) => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'captcha-image';
            imgDiv.style.backgroundImage = `url(${img})`;
            imgDiv.draggable = true;

            imgDiv.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', img);
            });

            optionContainer.appendChild(imgDiv);
        });

        referenceImage.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        referenceImage.addEventListener('drop', (event) => {
            event.preventDefault();
            const draggedImage = event.dataTransfer.getData('text/plain');
            if (draggedImage === correctImage) {
                resultMessage.textContent = 'Verification successful!';
                submitBtn.disabled = false;
                popup.style.display = 'none';
            } else {
                resultMessage.textContent = 'Verification failed. Please try again.';
                attemptCount++;
                if (attemptCount >= maxAttempts) {
                    alert('Too many failed attempts. Please refresh the page and try again.');
                    submitBtn.disabled = true;
                    popup.style.display = 'none';
                } else {
                    setupCaptcha();
                }
            }
        });
    }

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            popup.style.display = 'flex';
            setupCaptcha();
        } else {
            submitBtn.disabled = true;
        }
    });

    closePopup.addEventListener('click', () => {
        popup.style.display = 'none';
        checkbox.checked = false;
        submitBtn.disabled = true;
    });

    submitCaptcha.addEventListener('click', () => {
        resultMessage.textContent = 'Please complete the CAPTCHA to continue.';
    });
});

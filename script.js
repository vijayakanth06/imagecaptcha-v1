document.addEventListener('DOMContentLoaded', () => {
    const captchaCheckbox = document.getElementById('captcha-checkbox');
    const popup = document.getElementById('popup');
    const submitBtn = document.getElementById('submitBtn');
    const loginForm = document.getElementById('loginForm');
    const mainContainer = document.getElementById('main-container');
    const aadhaarInput = document.getElementById('aadhaar-input');

    // Ensure the page reloads if revisited
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
            window.location.reload();
        }
    });

    let attemptCount = 0;
    const requiredAttempts = 2;
    let successfulAttempts = 0;
    const images = [
        'a1.jpg', 'a2.jpg', 'a3.jpg', 'a4.jpg', 'a5.jpg', 'a6.jpg', 'a7.jpg', 'a8.jpg', 'a9.jpg', 'a10.jpg',
        'a11.jpg', 'a12.jpg', 'a13.jpg', 'a14.jpg'
    ];

    // Allow only digits in the Aadhaar input field
    aadhaarInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 12); // Replace non-digits and limit to 12 digits

        // Mark the input field as invalid if it doesn't have exactly 12 digits
        if (this.value.length === 12) {
            this.classList.remove('invalid');
        } else {
            this.classList.add('invalid');
        }
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function setupCaptcha() {
        const optionContainer = document.getElementById('option-container');
        const referenceImage = document.getElementById('reference-image');
        const resultMessage = document.getElementById('result-message');

        optionContainer.innerHTML = '';
        resultMessage.textContent = '';
        const shuffledImages = shuffleArray(images);
        const referenceIndex = Math.floor(Math.random() * 3);
        const options = shuffledImages.slice(0, 3);

        referenceImage.style.backgroundImage = `url('${options[referenceIndex]}')`;
        options.forEach((imgSrc, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('captcha-image');
            optionDiv.style.backgroundImage = `url('${imgSrc}')`;
            optionDiv.dataset.correct = index === referenceIndex;
            optionDiv.draggable = true;

            // Support for both desktop and mobile
            optionDiv.addEventListener('dragstart', dragStart);
            optionDiv.addEventListener('touchstart', touchStart);
            optionContainer.appendChild(optionDiv);
        });

        referenceImage.addEventListener('dragover', dragOver);
        referenceImage.addEventListener('drop', drop);
        referenceImage.addEventListener('touchmove', touchMove);
        referenceImage.addEventListener('touchend', touchEnd);
    }

    function dragStart(event) {
        event.dataTransfer.setData('text', event.target.dataset.correct);
    }

    function dragOver(event) {
        event.preventDefault();
    }

    function drop(event) {
        event.preventDefault();
        const isCorrect = event.dataTransfer.getData('text') === 'true';
        handleCaptchaResult(isCorrect);
    }

    // Mobile touch event handlers
    let selectedElement = null;

    function touchStart(event) {
        selectedElement = event.target;
    }

    function touchMove(event) {
        event.preventDefault(); // Prevent scrolling
        const touch = event.touches[0];
        const referenceImage = document.getElementById('reference-image');
        const rect = referenceImage.getBoundingClientRect();

        if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
        ) {
            handleCaptchaResult(selectedElement.dataset.correct === 'true');
        }
    }

    function touchEnd() {
        selectedElement = null;
    }

    function handleCaptchaResult(isCorrect) {
        const resultMessage = document.getElementById('result-message');

        if (isCorrect) {
            successfulAttempts++;
            if (successfulAttempts >= requiredAttempts) {
                captchaCheckbox.disabled = true;
                captchaCheckbox.checked = true;
                captchaCheckbox.style.accentColor = '#007bff'; // Change checkbox color to blue
                submitBtn.disabled = false;
                popup.style.display = 'none';
                mainContainer.classList.remove('blur');
                successfulAttempts = 0; // Reset attempts
            } else {
                setupCaptcha(); // Refresh captcha for the second round
            }
        } else {
            attemptCount++;
            resultMessage.textContent = 'Incorrect selection. Please try again.';
            if (attemptCount >= 2) { // Limit to 2 wrong attempts before refresh
                alert('Too many incorrect attempts. Reloading the page.');
                location.reload();
            }
        }
    }

    // Event Listeners
    captchaCheckbox.addEventListener('click', (e) => {
        if (captchaCheckbox.checked && aadhaarInput.value.length === 12) {
            popup.style.display = 'flex';
            setupCaptcha();
            mainContainer.classList.add('blur');
        } else {
            e.preventDefault();
            alert('Please enter a valid 12-digit Aadhar number first.');
            captchaCheckbox.checked = false;
        }
    });

    // Disable form submission until CAPTCHA is passed
    loginForm.addEventListener('submit', (e) => {
        if (submitBtn.disabled) {
            e.preventDefault();
            alert('Please complete the CAPTCHA before submitting.');
        }
    });
});

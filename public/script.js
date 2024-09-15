document.addEventListener('DOMContentLoaded', () => {
    const captchaCheckbox = document.getElementById('captcha-checkbox');
    const popup = document.getElementById('popup');
    const submitBtn = document.getElementById('submitBtn');
    const loginForm = document.getElementById('loginForm');
    const mainContainer = document.getElementById('main-container');
    const aadhaarInput = document.getElementById('aadhaar-input');
    const honeypot = document.getElementById('honeypot');
    const audioTryAnotherWayBtn = document.getElementById('audio-tryAnotherWayBtn');
    const tryAnotherWayBtn = document.getElementById('tryAnotherWayBtn');
    const audioPopup = document.getElementById('audio-popup');

    let cursorData = [];
    let successfulAttempts = 0;
    const requiredAttempts = 2;
    let failedAttempts = 0;
    let lastX = null, lastY = null, lastTime = null;
    let successfulAudioAttempts = 0;
    let failedAudioAttempts = 0;

    // Ensure the page reloads if revisited
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
            window.location.reload();
        }
    });

    aadhaarInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 12);
        this.classList.toggle('invalid', this.value.length !== 12);
    });

    // Session Timeout (3 minutes)
    let sessionTimeout = 3 * 60 * 1000; // 3 minutes in milliseconds
    let sessionTimer = setTimeout(() => {
        alert('Session expired. Please try again.');
        window.location.reload();
    }, sessionTimeout);
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;

    function resetTimer() {
        clearTimeout(sessionTimer);
        sessionTimer = setTimeout(() => {
            alert('Session expired. Please try again.');
            window.location.reload();
        }, sessionTimeout);
    }

    // Record cursor data including speed
    document.addEventListener('mousemove', (event) => {
        if (!captchaCheckbox.checked) {
            const currentX = event.clientX;
            const currentY = event.clientY;
            const currentTime = Date.now();

            if (lastX !== null && lastY !== null && lastTime !== null) {
                const distance = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));
                const timeDiff = currentTime - lastTime;
                const speed = distance / timeDiff;

                cursorData.push({ x: currentX, y: currentY, speed: speed });
            }

            lastX = currentX;
            lastY = currentY;
            lastTime = currentTime;
        }
    });

    function setupCaptcha() {
        const optionContainer = document.getElementById('option-container');
        const referenceImage = document.getElementById('reference-image');
        const resultMessage = document.getElementById('result-message');

        const images = [
            'a1.jpg', 'a2.jpg', 'a3.jpg', 'a4.jpg', 'a5.jpg', 'a6.jpg', 'a7.jpg', 'a8.jpg', 'a9.jpg', 'a10.jpg',
            'a11.jpg', 'a12.jpg', 'a13.jpg', 'a14.jpg'
        ];

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

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

    let selectedElement = null;

    function touchStart(event) {
        selectedElement = event.target;
    }

    function touchMove(event) {
        event.preventDefault();
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
        if (isCorrect) {
            successfulAttempts++;
            if (successfulAttempts >= requiredAttempts) {
                captchaCheckbox.disabled = true;
                captchaCheckbox.checked = true;
                captchaCheckbox.style.accentColor = '#007bff';
                submitBtn.disabled = false;
                popup.style.display = 'none';
                mainContainer.classList.remove('blur');
            } else {
                setupCaptcha();
            }
        } else {
            failedAttempts++;
            if (failedAttempts >= 2) {
                alert('Two incorrect attempts. The page will reload.');
                window.location.reload();
            } else {
                alert('Incorrect selection. Please try again.');
                setupCaptcha();
            }
        }
    }

    function sendCursorDataToServer() {
        fetch('/send-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cursorData: cursorData, honeypot: honeypot.value }),
        })
        .then(response => response.json())
        .then(data => {
            hideLoadingSpinner();
            if (data.message === 'Data processed successfully.') {
                captchaCheckbox.checked = true;
                captchaCheckbox.disabled = true;
                submitBtn.disabled = false;
            } else {
                captchaCheckbox.checked = false;
                captchaCheckbox.disabled = false;
                setupCaptcha();
                popup.style.display = 'flex';
                mainContainer.classList.add('blur');
            }
        })
        .catch(error => {
            hideLoadingSpinner();
            console.error('Error:', error);
        });
    }

    function showLoadingSpinner() {
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = 'block';
        captchaCheckbox.disabled = true;
    }

    function hideLoadingSpinner() {
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = 'none';
        captchaCheckbox.disabled = false;
    }

    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (aadhaarInput.value.length === 12) {
            showLoadingSpinner();
            sendCursorDataToServer();
        } else {
            alert('Please enter 12 digits.');
        }
    });

    setupCaptcha();
});

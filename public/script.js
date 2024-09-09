document.addEventListener('DOMContentLoaded', () => {
    const captchaCheckbox = document.getElementById('captcha-checkbox');
    const popup = document.getElementById('popup');
    const submitBtn = document.getElementById('submitBtn');
    const loginForm = document.getElementById('loginForm');
    const mainContainer = document.getElementById('main-container');
    const aadhaarInput = document.getElementById('aadhaar-input');
    
    const audioTryAnotherWayBtn = document.getElementById('audio-tryAnotherWayBtn');
    const tryAnotherWayBtn = document.getElementById('tryAnotherWayBtn');
    const audioPopup = document.getElementById('audio-popup');
    
    let cursorData = [];
    let successfulAttempts = 0;
    const requiredAttempts = 2;
    let failedAttempts = 0;
    let lastX = null, lastY = null, lastTime = null;
    let successfulAudioAttempts = 0;  // Counter for correct audio CAPTCHA attempts
    let failedAudioAttempts = 0;      // Counter for incorrect audio CAPTCHA attempts

    // Ensure the page reloads if revisited
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
            window.location.reload();
        }
    });

    aadhaarInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 12);
        if (this.value.length === 12) {
            this.classList.remove('invalid');
        } else {
            this.classList.add('invalid');
        }
    });

    // Session Timeout (3 minutes)
    let sessionTimeout = 3 * 60 * 1000; // 3 minutes in milliseconds
    let sessionTimer = setTimeout(() => {
        alert('Session expired. Please try again.');
        window.location.reload();
    }, sessionTimeout);

    // Reset session timeout on user activity
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
    document.ontouchmove = resetTimer;  // Reset on touch as well

    function resetTimer() {
        clearTimeout(sessionTimer);
        sessionTimer = setTimeout(() => {
            alert('Session expired. Please try again.');
            window.location.reload();
        }, sessionTimeout);
    }

    // Record cursor data including speed for mouse and touch events
    document.addEventListener('mousemove', recordCursorData);
    document.addEventListener('touchmove', recordTouchData);

    function recordCursorData(event) {
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
    }

    function recordTouchData(event) {
        if (!captchaCheckbox.checked) {
            const touch = event.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;
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
    }

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
        fetch('http://localhost:3000/send-data', {  // Ensure this matches the port where Express is running
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cursorData: cursorData }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.redirect) {
                window.location.href = data.redirect;
            } else if (data.message) {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    captchaCheckbox.addEventListener('click', (e) => {
        if (captchaCheckbox.checked && aadhaarInput.value.length === 12) {
            popup.style.display = 'flex';
            setupCaptcha();
            mainContainer.classList.add('blur');
            setupCaptcha();
        } else {
            e.preventDefault();
            alert('You must enter 12 numbers.');
            captchaCheckbox.checked = false;
        }
    });

    // Show the audio CAPTCHA popup
    function showAudioCaptcha() {
        popup.style.display = 'none';
        audioPopup.style.display = 'flex';
        mainContainer.classList.add('blur');
        setupAudioCaptcha();
    }

    // Show the image CAPTCHA popup
    function showImageCaptcha() {
        audioPopup.style.display = 'none';
        popup.style.display = 'flex';
        mainContainer.classList.add('blur');
        setupCaptcha();
    }

    tryAnotherWayBtn.addEventListener('click', showAudioCaptcha);
    audioTryAnotherWayBtn.addEventListener('click', showImageCaptcha);

    // Setup Audio CAPTCHA
    function setupAudioCaptcha() {
        const audioReferenceImage = document.getElementById('audio-reference-image');
        const audioOptionContainer = document.getElementById('audio-option-container');
        const audioResultMessage = document.getElementById('audio-result-message');

        const audioFiles = [
            'audio1.mp3', 'audio2.mp3', 'audio3.mp3', 'audio4.mp3', 'audio5.mp3',
            'audio6.mp3', 'audio7.mp3', 'audio8.mp3', 'audio9.mp3', 'audio10.mp3'
        ];

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        audioOptionContainer.innerHTML = '';
        audioResultMessage.textContent = '';
        const shuffledFiles = shuffleArray(audioFiles);
        const referenceAudioIndex = Math.floor(Math.random() * 3);
        const audioOptions = shuffledFiles.slice(0, 3);

        audioReferenceImage.src = audioOptions[referenceAudioIndex];
        audioOptions.forEach((audioSrc, index) => {
            const audioDiv = document.createElement('div');
            audioDiv.classList.add('audio-captcha-option');
            audioDiv.textContent = `Audio ${index + 1}`;
            audioDiv.dataset.correct = index === referenceAudioIndex;

            audioDiv.addEventListener('click', function() {
                const isCorrect = this.dataset.correct === 'true';
                handleAudioCaptchaResult(isCorrect);
            });

            audioOptionContainer.appendChild(audioDiv);
        });
    }

    function handleAudioCaptchaResult(isCorrect) {
        if (isCorrect) {
            successfulAudioAttempts++;
            if (successfulAudioAttempts >= requiredAttempts) {
                captchaCheckbox.disabled = true;
                captchaCheckbox.checked = true;
                captchaCheckbox.style.accentColor = '#007bff';
                submitBtn.disabled = false;
                audioPopup.style.display = 'none';
                mainContainer.classList.remove('blur');
            } else {
                setupAudioCaptcha();
            }
        } else {
            failedAudioAttempts++;
            if (failedAudioAttempts >= 2) {
                alert('Two incorrect attempts. The page will reload.');
                window.location.reload();
            } else {
                alert('Incorrect audio choice. Please try again.');
                setupAudioCaptcha();
            }
        }
    }

    submitBtn.addEventListener('click', function() {
        if (captchaCheckbox.checked) {
            sendCursorDataToServer(); // Send the cursor data before submitting
            loginForm.submit(); // Submit the form after sending data
        }
    });

});

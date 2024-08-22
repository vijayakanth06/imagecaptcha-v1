document.addEventListener('DOMContentLoaded', () => {
    const captchaCheckbox = document.getElementById('captcha-checkbox');
    const popup = document.getElementById('popup');
    const submitBtn = document.getElementById('submitBtn');
    const loginForm = document.getElementById('loginForm');
    const mainContainer = document.getElementById('main-container');
    const aadhaarInput = document.getElementById('aadhaar-input');
    var honeypot = document.getElementById('honeypot');
   

    let cursorData = [];
    let successfulAttempts = 0;
    const requiredAttempts = 2;
    let failedAttempts = 0;
    let lastX = null, lastY = null, lastTime = null;

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
                sendCursorDataToServer();
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
        const csvContent = "x,y,speed\n" + cursorData.map(d => `${d.x},${d.y},${d.speed}`).join("\n");

        fetch('http://localhost:8000/predict', {  // Ensure this matches the port where Flask is running
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ csvData: csvContent }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'human') {
                window.location.href = 'target.html';
            } else {
                alert('Bot detected! The page will reload.');
                window.location.reload();
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
        } else {
            e.preventDefault();
            alert('Please enter a valid 12-digit Aadhar number first.');
            captchaCheckbox.checked = false;
        }
    });

    loginForm.addEventListener('submit', (e) => {
        if (submitBtn.disabled) {
            if (honeypot.value) {
                // If honeypot field is filled, prevent form submission
                event.preventDefault();
                alert('Bot detected! Form submission blocked.');
                
            }
            e.preventDefault();
            alert('Please complete the CAPTCHA before submitting.');
        }
    });
});

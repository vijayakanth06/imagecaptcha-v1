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
    let successfulAudioAttempts = 0; 
    let failedAudioAttempts = 0;     

  
   window.addEventListener('pageshow', function(event) {
    if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
        window.location.reload();
    }
});
    /* aadhaarInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 12);
        if (this.value.length === 12) {
            this.classList.remove('invalid');
        } else {
            this.classList.add('invalid');
        }
    }); */

  
     let sessionTimeout = 3 * 60 * 1000;
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
            body: JSON.stringify({ cursorData: cursorData }),
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
        if (captchaCheckbox.checked) {
            captchaCheckbox.style.accentColor = '#007bff'; 
        }
    }

  
    captchaCheckbox.addEventListener('click', (e) => {
       // if (aadhaarInput.value.length === 12) {
            // Show loading spinner and disable checkbox during verification
            showLoadingSpinner();
            captchaCheckbox.disabled = true;
            sendCursorDataToServer();  // Verify user with server response
       // } 
       /* else {
            e.preventDefault();
            alert('You must enter 12 numbers.');
        } */
    });
    
    
   
    function showAudioCaptcha() {
        popup.style.display = 'none';
        audioPopup.style.display = 'flex';
        mainContainer.classList.add('blur');
        setupAudioCaptcha();
    }

   
    function showImageCaptcha() {
        audioPopup.style.display = 'none';
        popup.style.display = 'flex';
        mainContainer.classList.add('blur');
        setupCaptcha();
    }

    tryAnotherWayBtn.addEventListener('click', showAudioCaptcha);
    audioTryAnotherWayBtn.addEventListener('click', showImageCaptcha);


   
    function setupAudioCaptcha() {
        const audioReferenceImage = document.getElementById('audio-reference-image');
        const audioOptionContainer = document.getElementById('audio-option-container');
        const audioResultMessage = document.getElementById('audio-result-message');
        const audioElement = document.getElementById('captcha-audio');
        const audioSource = document.getElementById('audio-source');

       
        const audioFiles = [
            { file: 'cat.mp3', image: 'cat.jpg' },
            { file: 'dog.mp3', image: 'dog.jpg' },
            { file: 'horse.mp3', image: 'horse.jpg' },
            { file: 'elephant.mp3', image: 'elephant.jpg' },
            { file: 'tiger.mp3', image: 'tiger.jpg' },
            { file: 'goat.mp3', image: 'goat.jpg' }
            
        ];

        const images = [
            'cat.jpg', 'dog.jpg', 'horse.jpg', 'elephant.jpg', 'tiger.jpg', 'goat.jpg'
        ];

        const selectedAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        const correctImage = selectedAudio.image;

       
        const shuffledImages = shuffleArray(images);
        const options = shuffledImages.slice(0, 3);
        if (!options.includes(correctImage)) {
            options[Math.floor(Math.random() * options.length)] = correctImage;
        }

       
        audioSource.src = selectedAudio.file;
        audioElement.load();  // Ensure the audio is loaded
        audioElement.play().catch(error => {
            console.error('Audio play error:', error);
        });


      /*   
        audioReferenceImage.style.backgroundImage = `url('${correctImage}')`; */

        
        audioOptionContainer.innerHTML = '';
        options.forEach((imgSrc, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('captcha-image');
            optionDiv.style.backgroundImage = `url('${imgSrc}')`;
            optionDiv.dataset.correct = imgSrc === correctImage;
            optionDiv.addEventListener('click', function () {
                handleAudioCaptchaResult(this.dataset.correct === 'true');
            });
            audioOptionContainer.appendChild(optionDiv);
        });
    }

   
    function handleAudioCaptchaResult(isCorrect) {
        if (isCorrect) {
            successfulAudioAttempts++;
            if (successfulAudioAttempts >= requiredAttempts) {
                audioPopup.style.display = 'none';
                mainContainer.classList.remove('blur');
                captchaCheckbox.checked = true; 
                captchaCheckbox.disabled = true;  
                submitBtn.disabled = false; 
            } else {
                setupAudioCaptcha(); 
            }
        } else {
            failedAudioAttempts++;
            if (failedAudioAttempts >= 2) {
                alert('Two incorrect attempts. The page will reload.');
                window.location.reload();
            } else {
                alert('Incorrect. Try again.');
                setupAudioCaptcha();  
            }
        }
    }

    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }


  
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();  

    var honeypot = document.getElementById('honeypot').value;
    if (honeypot) {
        alert('BOT detected!');
        window.location.reload();
    } else {
        
        window.location.href = 'target.html';
    }
});
});

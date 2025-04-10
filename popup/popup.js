const micIcon = document.getElementById('mic-icon');
const statusText = document.querySelector('.status');

chrome.runtime.sendMessage({action: 'get_mic_state'}, (response) => {
  updateUI(response.isActive);
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'mic_state_changed') {
    updateUI(request.isActive);
  }
});

function updateUI(isActive) {
    const iconPath = isActive ? '/icons/mic-on-48.png' : '/icons/mic-off-48.png';
    micIcon.src = chrome.runtime.getURL(iconPath);
    
    if (isActive) {
      micIcon.classList.add('mic-pulse');
      statusText.textContent = 'Микрофон активен - говорите';
      statusText.style.color = '#1a73e8';
    } else {
      micIcon.classList.remove('mic-pulse');
      statusText.textContent = 'Нажмите Ctrl+Space для активации';
      statusText.style.color = '#555';
    }
  }

  async function requestMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      console.error('Microphone access error:', err);
      return false;
    }
  }

micIcon.addEventListener('click', async () => {
    const hasPermission = await requestMicrophone();
  
  if (hasPermission) {
    chrome.runtime.sendMessage({action: 'toggle_mic'});
  } else {
    statusText.textContent = 'Микрофон заблокирован. Нажмите 🔒 в адресной строке';
    statusText.style.color = 'red';
  }
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'update_transcript') {
      document.getElementById('transcript').textContent = request.transcript;
    }
    
    if (request.action === 'recognition_error') {
      document.querySelector('.status').textContent = `Ошибка: ${request.error}`;
    }
  });
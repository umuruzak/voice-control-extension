let recognition;
let isMicActive = false;

if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  console.error('Web Speech API не поддерживается в этом браузере');
  chrome.runtime.sendMessage({
    action: 'recognition_error',
    error: 'API_NOT_SUPPORTED'
  });
} else {
  console.log('Web Speech API доступен');
}

function initSpeechRecognition() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'ru-RU';

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');
    
    processVoiceCommand(transcript);
    
    chrome.runtime.sendMessage({
      action: 'update_transcript',
      transcript: transcript
    });
  };

  recognition.onerror = (event) => {
    console.error('Ошибка распознавания:', event.error);
    chrome.runtime.sendMessage({
      action: 'recognition_error',
      error: event.error
    });
  };
}

function processVoiceCommand(command) {
  console.log('Распознанная команда:', command);
  
  const normalizedCmd = command.toLowerCase().trim();
  
  if (normalizedCmd.includes('новая вкладка')) {
    chrome.runtime.sendMessage({action: 'new_tab'});
    return;
  } 
  else if (normalizedCmd.includes('закрыть вкладку')) {
    chrome.runtime.sendMessage({action: 'close_tab'});
    return;
  }

    const tabSwitchMatch = normalizedCmd.match(/(\d+)(?:ая|ой|я)? вкладка/);
    if (tabSwitchMatch) {
      const tabIndex = parseInt(tabSwitchMatch[1]) - 1;
      chrome.runtime.sendMessage({
        action: 'switch_tab',
        index: tabIndex
      });
      return;
    }

  const openSiteMatch = normalizedCmd.match(/открыть (.*)/);
  if (openSiteMatch) {
    let siteName = openSiteMatch[1]
      .replace(/\s+/g, ' ') 
      .replace(/ /g, '-')  
      .replace(/\./g, '-')  
      .toLowerCase();
    
    if (!siteName.includes('.')) {
      siteName += '.com';
    }
    
    chrome.runtime.sendMessage({
      action: 'open_site',
      url: 'https://' + siteName
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'mic_state_changed') {
    console.log(`Состояние микрофона: ${request.isActive ? 'активен' : 'неактивен'}`);
    
    if (request.isActive) {
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }
  }
  return true;
});

function startVoiceRecognition() {
  if (!recognition) initSpeechRecognition();
  try {
    recognition.start();
    isMicActive = true;
    console.log('Распознавание речи запущено');
  } catch (e) {
    console.error('Ошибка запуска распознавания:', e);
    chrome.runtime.sendMessage({
      action: 'recognition_error',
      error: 'START_FAILED'
    });
  }
}

function stopVoiceRecognition() {
  if (recognition) {
    recognition.stop();
    isMicActive = false;
    console.log('Распознавание речи остановлено');
  }
}

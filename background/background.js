let isMicActive = false;

async function toggleMicrophone() {
  try {
    isMicActive = !isMicActive;
    
    await chrome.action.setIcon({
      path: isMicActive ? 
        { "16": "/icons/mic-on-16.png", "24": "/icons/mic-on-24.png", "32": "/icons/mic-on-32.png" } : 
        { "16": "/icons/mic-off-16.png", "24": "/icons/mic-off-24.png", "32": "/icons/mic-off-32.png" }
    });

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'mic_state_changed',
          isActive: isMicActive
        });
      } catch (err) {
        console.log('Не удалось отправить сообщение:', err);
      }
    }
  } catch (error) {
    console.error('Ошибка при переключении микрофона:', error);
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_mic') {
    toggleMicrophone();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_mic_state') {
    sendResponse({isActive: isMicActive});
  }
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'new_tab':
      chrome.tabs.create({});
      break;
      
    case 'close_tab':
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) chrome.tabs.remove(tabs[0].id);
      });
      break;

    case 'switch_tab':
      chrome.tabs.query({}, (tabs) => {
        if (tabs[request.index]) {
          chrome.tabs.update(tabs[request.index].id, {active: true});
        }
      });
      break;
      
    case 'open_site':
      chrome.tabs.create({url: request.url});
      break;
      
    case 'update_transcript':
      chrome.runtime.sendMessage(request);
      break;
  }
  return true;
});
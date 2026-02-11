const youtubeUrlInput = document.getElementById('youtubeUrl');
const loadVideoBtn = document.getElementById('loadVideoBtn');
const playerWrapper = document.getElementById('playerWrapper');
const youtubePlayer = document.getElementById('youtubePlayer');

const counterElement = document.getElementById('counter');
const statusElement = document.getElementById('status');
const lastDetectedElement = document.getElementById('lastDetected');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let spoilerCount = 0;
let isListening = false;

const spoilerRegex = /\bspoiler\b/gi;

function extractYouTubeId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1);
    }

    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }

  return null;
}

function updateCounter(value) {
  spoilerCount = value;
  counterElement.textContent = spoilerCount;
}

function setStatus(text, recording = false) {
  statusElement.textContent = text;
  statusElement.classList.toggle('recording', recording);
}

function initRecognition() {
  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();

      if (!transcript) {
        continue;
      }

      lastDetectedElement.textContent = transcript;

      if (result.isFinal) {
        const matches = transcript.match(spoilerRegex);
        if (matches?.length) {
          updateCounter(spoilerCount + matches.length);
        }
      }
    }
  };

  recognition.onerror = (event) => {
    setStatus(`Error de reconocimiento: ${event.error}.`, false);
  };

  recognition.onend = () => {
    if (isListening) {
      recognition.start();
      return;
    }

    setStatus('Escucha detenida.', false);
    stopBtn.disabled = true;
    startBtn.disabled = false;
  };
}

loadVideoBtn.addEventListener('click', () => {
  const url = youtubeUrlInput.value.trim();
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    setStatus('URL de YouTube no válida.', false);
    return;
  }

  youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  playerWrapper.classList.remove('hidden');
  setStatus('Vídeo cargado. Ahora inicia la escucha.', false);
});

startBtn.addEventListener('click', () => {
  if (!SpeechRecognition) {
    setStatus('Tu navegador no soporta SpeechRecognition. Prueba con Chrome o Edge.', false);
    return;
  }

  if (!recognition) {
    initRecognition();
  }

  isListening = true;
  recognition.start();
  setStatus('Escuchando... detectando la palabra “Spoiler”.', true);
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  isListening = false;
  if (recognition) {
    recognition.stop();
  }
  setStatus('Deteniendo escucha...', false);
});

resetBtn.addEventListener('click', () => {
  updateCounter(0);
  lastDetectedElement.textContent = 'Aún no hay transcripción.';
  setStatus('Contador reiniciado.', false);
});

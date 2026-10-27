class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<() => void> = new Set();
  public isPlaying = false;
  public isMuted = false;
  public hasStarted = false;

  init() {
    if (this.audio) return;
    this.audio = new Audio('/assets/do4love.mp3');
    this.audio.preload = 'auto'; // Force browser to start downloading immediately
    this.audio.volume = 0.65;
    this.audio.loop = true;
    this.audio.muted = false;
    this.isMuted = false;

    // Safely restore saved playback position once metadata is loaded
    // Setting currentTime before loadedmetadata can cause Range Request delays or InvalidStateErrors
    const savedTime = sessionStorage.getItem('ore_dara_music_time');
    if (savedTime) {
      const timeNum = parseFloat(savedTime);
      if (!isNaN(timeNum) && timeNum > 0) {
        this.audio.addEventListener('loadedmetadata', () => {
          if (this.audio) this.audio.currentTime = timeNum;
        }, { once: true });
      }
    }

    // Persist playback position periodically
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio && this.audio.currentTime > 0) {
        try {
          sessionStorage.setItem('ore_dara_music_time', String(this.audio.currentTime));
        } catch (e) {}
      }
    });

    window.addEventListener('beforeunload', () => {
      if (this.audio && this.audio.currentTime > 0) {
        try {
          sessionStorage.setItem('ore_dara_music_time', String(this.audio.currentTime));
        } catch (e) {}
      }
    });

    // Autoplay attempt unmuted
    this.audio.play()
      .then(() => {
        this.isPlaying = true;
        this.hasStarted = true;
        this.isMuted = false;
        this.notify();
      })
      .catch(() => {
        // Autoplay policy waiting for user gesture
        this.isPlaying = false;
        this.notify();
      });

    const startOnInteraction = () => {
      if (this.audio && !this.hasStarted) {
        this.audio.muted = false;
        this.isMuted = false;
        this.audio.play()
          .then(() => {
            this.isPlaying = true;
            this.hasStarted = true;
            this.isMuted = false;
            this.notify();
          })
          .catch(() => {});
      }
    };

    window.addEventListener('click', startOnInteraction, { once: true });
    window.addEventListener('touchstart', startOnInteraction, { once: true });
    window.addEventListener('scroll', startOnInteraction, { once: true });
  }

  toggle() {
    if (!this.audio) {
      this.init();
      return;
    }

    if (this.audio.paused) {
      this.audio.muted = false;
      this.isMuted = false;
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.notify();
      });
    } else {
      this.isMuted = !this.isMuted;
      this.audio.muted = this.isMuted;
      this.notify();
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.notify();
    }
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const audioManager = new AudioManager();

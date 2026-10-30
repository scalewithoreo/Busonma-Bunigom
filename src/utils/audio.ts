class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<() => void> = new Set();
  public isPlaying = false;
  public isMuted = false;
  public userHasInteracted = false;

  init() {
    if (this.audio) return;
    this.audio = new Audio('/assets/do4love.mp3');
    this.audio.preload = 'auto';
    this.audio.volume = 0.65;
    this.audio.loop = true;
    this.audio.muted = this.isMuted;

    // Safely restore saved playback position once metadata is loaded
    const savedTime = sessionStorage.getItem('mm_music_time');
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
          sessionStorage.setItem('mm_music_time', String(this.audio.currentTime));
        } catch (e) {}
      }
    });

    window.addEventListener('beforeunload', () => {
      if (this.audio && this.audio.currentTime > 0) {
        try {
          sessionStorage.setItem('mm_music_time', String(this.audio.currentTime));
        } catch (e) {}
      }
    });

    // Try starting unmuted if allowed by browser policy
    this.audio.play()
      .then(() => {
        this.isPlaying = true;
        this.notify();
      })
      .catch(() => {
        // Autoplay policy: waiting for user gesture
        this.isPlaying = false;
        this.notify();
      });
  }

  play() {
    if (!this.audio) {
      this.init();
    }
    if (this.audio) {
      // Respect user's mute state
      this.audio.muted = this.isMuted;
      this.audio.play()
        .then(() => {
          this.isPlaying = true;
          this.notify();
        })
        .catch(() => {});
    }
  }

  toggle() {
    if (!this.audio) {
      this.init();
    }
    if (!this.audio) return;

    if (this.audio.paused) {
      this.isMuted = false;
      this.audio.muted = false;
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.notify();
      }).catch(() => {});
    } else {
      // Toggle mute
      this.isMuted = !this.isMuted;
      this.audio.muted = this.isMuted;
      this.notify();
    }
  }

  mute() {
    this.isMuted = true;
    if (this.audio) {
      this.audio.muted = true;
    }
    this.notify();
  }

  unmute() {
    this.isMuted = false;
    if (this.audio) {
      this.audio.muted = false;
      if (this.audio.paused) {
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.notify();
        }).catch(() => {});
      }
    }
    this.notify();
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

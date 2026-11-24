export class JungleAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private dayLayerGain: GainNode | null = null;
  private nightLayerGain: GainNode | null = null;
  private rainGain: GainNode | null = null;

  private windNode: AudioBufferSourceNode | null = null;
  private windLfoOsc: OscillatorNode | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private faunaTimer: number | null = null;

  private ambientVolume = 0.75;
  private sfxVolume = 0.8;
  private muted = false;
  private nightFactor = 0; // 0 = day, 1 = night
  private twilightFactor = 0; // 0 = noon/midnight, 1 = dawn/dusk
  private started = false;

  private scaledAmbientGain(): number {
    if (this.muted || this.ambientVolume <= 0.001) return 0;
    return Math.pow(this.ambientVolume, 1.35) * 0.38;
  }

  private scaledSfxGain(): number {
    if (this.muted || this.sfxVolume <= 0.001) return 0;
    return Math.pow(this.sfxVolume, 1.25);
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.scaledAmbientGain();
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.scaledSfxGain();
      this.sfxGain.connect(this.masterGain);

      this.dayLayerGain = this.ctx.createGain();
      this.dayLayerGain.gain.value = 1 - this.nightFactor * 0.9;
      this.dayLayerGain.connect(this.ambientGain);

      this.nightLayerGain = this.ctx.createGain();
      this.nightLayerGain.gain.value = this.nightFactor;
      this.nightLayerGain.connect(this.ambientGain);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    if (!this.started && this.ctx && this.ambientGain) {
      this.started = true;
      this.startJungleAmbiance();
    }
  }

  public setSettings(ambientVolume: number, sfxVolume: number, muted: boolean): void {
    this.ambientVolume = Math.max(0, Math.min(1, ambientVolume));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
    this.muted = muted;

    if (!this.ctx) return;
    if (!this.muted && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.02);
    }
    if (this.ambientGain) {
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setTargetAtTime(this.scaledAmbientGain(), now, 0.03);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setTargetAtTime(this.scaledSfxGain(), now, 0.02);
    }
  }

  public setNightFactor(factor: number, twilightFactor = 0): void {
    this.nightFactor = Math.max(0, Math.min(1, factor));
    this.twilightFactor = Math.max(0, Math.min(1, twilightFactor));
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (this.dayLayerGain) {
      // Fade daytime birds smoothly out at night
      const dayGain = Math.max(0, 1 - Math.max(0, (this.nightFactor - 0.15) / 0.6));
      this.dayLayerGain.gain.setTargetAtTime(dayGain, now, 0.4);
    }
    if (this.nightLayerGain) {
      // Night creatures only fade in once night settles
      const nightGain = Math.max(0, Math.min(1, (this.nightFactor - 0.45) / 0.45));
      this.nightLayerGain.gain.setTargetAtTime(nightGain, now, 0.45);
    }
  }

  public setRainIntensity(intensity: number): void {
    if (this.rainGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, intensity));
      this.rainGain.gain.setTargetAtTime(clamped * 0.24, this.ctx.currentTime, 0.25);
    }
  }

  private startJungleAmbiance(): void {
    if (!this.ctx || !this.ambientGain) return;

    // 1. Soft, breathing canopy foliage breeze (no harsh static or oscillators)
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.998 * b0 + white * 0.022;
      b1 = 0.988 * b1 + white * 0.024;
      b2 = 0.96 * b2 + white * 0.032;
      data[i] = (b0 + b1 + b2) * 0.28;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.5;

    const breezeGain = this.ctx.createGain();
    breezeGain.gain.value = 0.14;

    // Slow natural wind swell LFO (~14 second breath cycle)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.072;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.075;
    lfo.connect(lfoGain);
    lfoGain.connect(breezeGain.gain);
    lfo.start();
    this.windLfoOsc = lfo;

    noise.connect(filter);
    filter.connect(breezeGain);
    breezeGain.connect(this.ambientGain);
    noise.start();
    this.windNode = noise;

    // 2. Soft rain patter bed (0 during clear weather)
    const rainBufSize = this.ctx.sampleRate * 2;
    const rainBuf = this.ctx.createBuffer(1, rainBufSize, this.ctx.sampleRate);
    const rainData = rainBuf.getChannelData(0);
    let rPrev = 0;
    for (let i = 0; i < rainBufSize; i++) {
      const w = Math.random() * 2 - 1;
      rPrev = rPrev * 0.65 + w * 0.35;
      rainData[i] = rPrev * 0.22;
    }
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = rainBuf;
    rainSrc.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1550;
    rainFilter.Q.value = 0.55;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambientGain);
    rainSrc.start();
    this.rainNode = rainSrc;

    // 3. Natural, paused spatial day/twilight/night wildlife scheduler
    const scheduleFauna = () => {
      const delayMs = 2600 + Math.random() * 3800;
      this.faunaTimer = window.setTimeout(() => {
        this.playContextualFauna();
        scheduleFauna();
      }, delayMs);
    };
    scheduleFauna();
  }

  private createSpatialPan(target: AudioNode, panValue: number): AudioNode {
    if (!this.ctx || typeof this.ctx.createStereoPanner !== 'function') return target;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.85, Math.min(0.85, panValue));
    panner.connect(target);
    return panner;
  }

  private playContextualFauna(): void {
    if (
      !this.ctx ||
      this.muted ||
      this.ambientVolume <= 0.005 ||
      this.ctx.state !== 'running'
    ) {
      return;
    }

    // Natural quiet pauses (~22% of cycles stay silent so the jungle breathes)
    if (Math.random() < 0.22) return;

    const pan = (Math.random() - 0.5) * 1.5;

    if (this.nightFactor < 0.45 && this.dayLayerGain) {
      const r = Math.random();
      if (this.twilightFactor > 0.35 && r < 0.35) {
        this.playTwilightTreeFrog(pan);
      } else if (r < 0.72) {
        this.playBirdChirp(pan);
      } else if (r < 0.9) {
        this.playDistantTropicalCall(pan);
      } else {
        this.playLeafRustleGust(pan);
      }
      return;
    }

    if (this.nightFactor >= 0.58 && this.nightLayerGain) {
      // Strictly nighttime: gentle, low-volume crickets & occasional owl hoots
      const r = Math.random();
      if (r < 0.52) {
        this.playCricketChirp(pan);
      } else if (r < 0.85) {
        this.playOwlHoot(pan);
      } else {
        this.playLeafRustleGust(pan);
      }
    }
  }

  private playLeafRustleGust(pan: number): void {
    if (!this.ctx || !this.ambientGain) return;
    const dest = this.createSpatialPan(this.ambientGain, pan);
    const now = this.ctx.currentTime;
    const dur = 1.2 + Math.random() * 0.7;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      const env = Math.sin(t * Math.PI);
      const w = Math.random() * 2 - 1;
      prev = prev * 0.78 + w * 0.22;
      data[i] = prev * env * 0.25;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900 + Math.random() * 350;
    filter.Q.value = 0.9;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.09;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(now);
  }

  private playBirdChirp(pan: number): void {
    if (!this.ctx || !this.dayLayerGain) return;
    const dest = this.createSpatialPan(this.dayLayerGain, pan);
    const now = this.ctx.currentTime;
    const baseFreq = 1350 + Math.random() * 850;
    const notes = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < notes; i++) {
      const start = now + i * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * (1 + i * 0.07), start);
      osc.frequency.exponentialRampToValueAtTime(
        baseFreq * (1.24 + Math.random() * 0.14),
        start + 0.06,
      );
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, start + 0.12);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.055, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(start);
      osc.stop(start + 0.14);
    }
  }

  private playDistantTropicalCall(pan: number): void {
    if (!this.ctx || !this.dayLayerGain) return;
    const dest = this.createSpatialPan(this.dayLayerGain, pan);
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const start = now + i * 0.28;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f = i === 0 ? 640 : 530;
      osc.frequency.setValueAtTime(f, start);
      osc.frequency.exponentialRampToValueAtTime(f * 0.84, start + 0.18);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.042, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(start);
      osc.stop(start + 0.22);
    }
  }

  private playTwilightTreeFrog(pan: number): void {
    if (!this.ctx || !this.dayLayerGain) return;
    const dest = this.createSpatialPan(this.dayLayerGain, pan);
    const now = this.ctx.currentTime;
    const baseFreq = 520 + Math.random() * 140;
    for (let i = 0; i < 3; i++) {
      const start = now + i * 0.13;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, start);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, start + 0.055);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.028, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.075);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(start);
      osc.stop(start + 0.085);
    }
  }

  private playCricketChirp(pan: number): void {
    if (!this.ctx || !this.nightLayerGain) return;
    const dest = this.createSpatialPan(this.nightLayerGain, pan);
    const now = this.ctx.currentTime;
    const pulses = 3;
    const freq = 2950 + Math.random() * 350;

    // Gentle bandpass to keep night cricket warm and soft
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 3.0;
    filter.connect(dest);

    for (let i = 0; i < pulses; i++) {
      const start = now + i * 0.068;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.018, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(start);
      osc.stop(start + 0.052);
    }
  }

  private playOwlHoot(pan: number): void {
    if (!this.ctx || !this.nightLayerGain) return;
    const dest = this.createSpatialPan(this.nightLayerGain, pan);
    const now = this.ctx.currentTime;
    const notes = [
      { offset: 0, dur: 0.28, f0: 380, f1: 345 },
      { offset: 0.45, dur: 0.44, f0: 360, f1: 305 },
    ];
    notes.forEach((n) => {
      if (!this.ctx) return;
      const start = now + n.offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f0, start);
      osc.frequency.exponentialRampToValueAtTime(n.f1, start + n.dur);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.055, start + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(start);
      osc.stop(start + n.dur + 0.02);
    });
  }

  public playFootstep(onTrail: boolean, sprinting: boolean): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;

    const dur = 0.065;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2.2);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = onTrail ? 'lowpass' : 'bandpass';
    filter.frequency.value = onTrail ? 420 + Math.random() * 110 : 950 + Math.random() * 350;
    filter.Q.value = onTrail ? 1.0 : 1.5;

    const gain = this.ctx.createGain();
    gain.gain.value = sprinting ? 0.16 : 0.11;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playLand(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCollectRelic(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.47);
    });
  }

  public playDiscoverLandmark(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const freqs = [392.0, 493.88, 587.33, 783.99];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.72);
    });
  }

  public playPickupItem(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    [480, 680].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  public playUseConsumable(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    [523.25, 659.25, 880].forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  public playToggleLight(on: boolean): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(on ? 720 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(on ? 960 : 320, now + 0.045);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playUiClick(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.045);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playSwingWeapon(heavy: boolean): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const dur = heavy ? 0.16 : 0.11;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(heavy ? 480 : 880, now);
    filter.frequency.exponentialRampToValueAtTime(heavy ? 220 : 380, now + dur);
    filter.Q.value = 1.4;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.24;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  public playHitPredator(): void {
    this.playAnimalHit(false);
  }

  public playAnimalHit(heavy = false): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    // Crisp dry body thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 185 : 230, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.14);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);

    // Subtle crisp impact snap
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = 'sine';
    snap.frequency.setValueAtTime(heavy ? 480 : 620, now);
    snap.frequency.exponentialRampToValueAtTime(190, now + 0.055);
    snapGain.gain.setValueAtTime(0.14, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    snap.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snap.start(now);
    snap.stop(now + 0.065);
  }

  public playAnimalDeath(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    [220, 140, 88].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, start + 0.14);
      gain.gain.setValueAtTime(0.22 - idx * 0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.17);
    });
  }

  public playWoodChop(heavy = false): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 165 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(64, now + 0.11);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);

    // Crisp wooden crack transient
    const dur = 0.065;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.pow(1 - i / bufSize, 1.8);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = heavy ? 860 : 1120;
    bp.Q.value = 1.6;
    const nGain = this.ctx.createGain();
    nGain.gain.value = 0.28;
    src.connect(bp);
    bp.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(now);
  }

  public playTreeFall(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    // Timber creak
    const creak = this.ctx.createOscillator();
    const creakGain = this.ctx.createGain();
    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(145, now);
    creak.frequency.exponentialRampToValueAtTime(72, now + 0.42);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    creakGain.gain.setValueAtTime(0.001, now);
    creakGain.gain.linearRampToValueAtTime(0.16, now + 0.08);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    creak.connect(lp);
    lp.connect(creakGain);
    creakGain.connect(this.sfxGain);
    creak.start(now);
    creak.stop(now + 0.46);

    // Delayed ground crash thud at ~0.78s
    const crashTime = now + 0.78;
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(98, crashTime);
    thud.frequency.exponentialRampToValueAtTime(34, crashTime + 0.32);
    thudGain.gain.setValueAtTime(0.36, crashTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, crashTime + 0.34);
    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(crashTime);
    thud.stop(crashTime + 0.35);

    const dur = 0.28;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.2);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const crashLp = this.ctx.createBiquadFilter();
    crashLp.type = 'lowpass';
    crashLp.frequency.value = 680;
    const nGain = this.ctx.createGain();
    nGain.gain.value = 0.24;
    src.connect(crashLp);
    crashLp.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(crashTime);
  }

  public playRockHit(heavy = false): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    // Hard stony clink
    const clink = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    clink.type = 'triangle';
    clink.frequency.setValueAtTime(heavy ? 740 : 920, now);
    clink.frequency.exponentialRampToValueAtTime(280, now + 0.075);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    clink.connect(gain);
    gain.connect(this.sfxGain);
    clink.start(now);
    clink.stop(now + 0.09);

    const ring = this.ctx.createOscillator();
    const rGain = this.ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(1480, now);
    ring.frequency.exponentialRampToValueAtTime(880, now + 0.05);
    rGain.gain.setValueAtTime(0.11, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    ring.connect(rGain);
    rGain.connect(this.sfxGain);
    ring.start(now);
    ring.stop(now + 0.06);
  }

  public playRockShatter(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    // Crackle of splitting stone
    const dur = 0.32;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.3);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1250, now);
    bp.frequency.exponentialRampToValueAtTime(340, now + dur);
    bp.Q.value = 0.9;
    const nGain = this.ctx.createGain();
    nGain.gain.value = 0.34;
    src.connect(bp);
    bp.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(now);

    [420, 290, 180].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.48, start + 0.12);
      g.gain.setValueAtTime(0.2, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.14);
    });
  }

  public playCampfireLight(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const dur = 0.28;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * (0.65 + (i % 19 === 0 ? 0.5 : 0));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + dur);
    filter.Q.value = 1.1;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  public playRoastMeat(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const dur = 0.34;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.pow(1 - i / bufSize, 0.7);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2400;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.16;

    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);

    // Warm completion chime
    [523.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + 0.14 + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.13, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  public playPlayerHurt(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 460;

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playPredatorGrowl(pan = 0): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const dest = this.createSpatialPan(this.sfxGain, pan);
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.linearRampToValueAtTime(72, now + 0.42);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(118, now);
    osc2.frequency.linearRampToValueAtTime(84, now + 0.42);

    filter.type = 'lowpass';
    filter.frequency.value = 340;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.48);
    osc2.stop(now + 0.48);
  }

  public playWaterSplash(intense = false): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const dur = intense ? 0.34 : 0.19;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      const env = Math.sin(Math.min(1, t * 4) * (Math.PI * 0.5)) * Math.pow(1 - t, 1.35);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(intense ? 780 : 1080, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + dur);
    filter.Q.value = 0.85;

    const gain = this.ctx.createGain();
    gain.gain.value = intense ? 0.24 : 0.13;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  public playSwimStroke(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const dur = 0.26;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.8;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(620, now);
    lp.frequency.linearRampToValueAtTime(260, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.value = 0.16;

    src.connect(lp);
    lp.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  public playNpcChime(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.11, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  public playSleepChime(): void {
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.001 || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    // Soft lullaby fade followed by warm morning chord
    const notes = [
      { freq: 392.0, delay: 0.0, dur: 0.45, vol: 0.08 },
      { freq: 329.63, delay: 0.18, dur: 0.52, vol: 0.075 },
      { freq: 523.25, delay: 0.85, dur: 0.55, vol: 0.085 },
      { freq: 659.25, delay: 0.96, dur: 0.6, vol: 0.09 },
      { freq: 783.99, delay: 1.08, dur: 0.72, vol: 0.08 },
    ];
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const start = now + n.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(n.vol, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + n.dur + 0.04);
    }
  }

  public dispose(): void {
    if (this.faunaTimer !== null) {
      window.clearTimeout(this.faunaTimer);
      this.faunaTimer = null;
    }
    if (this.windLfoOsc) {
      try {
        this.windLfoOsc.stop();
      } catch {
        // ignore
      }
      this.windLfoOsc.disconnect();
      this.windLfoOsc = null;
    }
    if (this.windNode) {
      try {
        this.windNode.stop();
      } catch {
        // ignore
      }
      this.windNode.disconnect();
      this.windNode = null;
    }
    if (this.rainNode) {
      try {
        this.rainNode.stop();
      } catch {
        // ignore
      }
      this.rainNode.disconnect();
      this.rainNode = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

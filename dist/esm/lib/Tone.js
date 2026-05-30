export class Tone {
    constructor() {
        this.playing = false;
    }
    connect(context, frequency, preset, destination) {
        this.context = context;
        this.adsr = preset.adsr;
        // oscillator
        this.oscillator = this.context.createOscillator();
        this.oscillator.frequency.value = frequency;
        if (preset.waveType === "custom") {
            const wave = this.context.createPeriodicWave(new Float32Array(preset.real), new Float32Array(preset.imag));
            this.oscillator.setPeriodicWave(wave);
        }
        else {
            this.oscillator.type = preset.waveType;
        }
        // gain
        this.gain = this.context.createGain();
        this.gain.gain.value = 0;
        // connect
        this.oscillator.connect(this.gain);
        this.gain.connect(destination);
        // start
        this.oscillator.start();
    }
    get frequency() {
        var _a;
        return ((_a = this.oscillator) === null || _a === void 0 ? void 0 : _a.frequency.value) || 0;
    }
    set frequency(value) {
        if (this.oscillator) {
            this.oscillator.frequency.value = value;
        }
    }
    start() {
        this.playing = true;
    }
    stop() {
        this.playing = false;
        if (this.context && this.gain) {
            const now = this.context.currentTime;
            this.gain.gain.cancelScheduledValues(now);
            this.gain.gain.setValueAtTime(0, now);
        }
    }
    // OscillatorNode は仕様上 stop() 後に再利用不可。
    // stop() は再生停止のみを担い、リソースの完全解放はこちらで行う（使い捨て）。
    destroy() {
        this.playing = false;
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = undefined;
        }
        if (this.gain) {
            this.gain.disconnect();
            this.gain = undefined;
        }
    }
    ping(noteDuration) {
        if (!this.playing || !this.gain || !this.context || !this.adsr)
            return;
        const now = this.context.currentTime;
        const { attack, decay, sustain, release } = this.adsr;
        // 前回のスケジュールをキャンセルしてリセット
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(0, now);
        // Attack: 0 → 1.0
        this.gain.gain.linearRampToValueAtTime(1.0, now + attack);
        // Decay: 1.0 → sustain
        this.gain.gain.linearRampToValueAtTime(sustain, now + attack + decay);
        // Release: sustain → 0（noteDuration または AD終了後の遅い方から開始）
        if (release > 0) {
            const releaseStart = Math.max(now + noteDuration, now + attack + decay);
            // exponentialRampToValueAtTime はゼロを扱えないため、最低値を 0.0001 に制限
            const sustainLevel = Math.max(sustain, 0.0001);
            this.gain.gain.setValueAtTime(sustainLevel, releaseStart);
            this.gain.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);
        }
    }
}

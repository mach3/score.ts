"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drum = void 0;
const beats_1 = require("../const/beats");
class Drum {
    connect(context, destination) {
        this.context = context;
        this.destination = destination;
        const sampleRate = context.sampleRate;
        const bufferDur = 0.1;
        this.noiseBuffer = context.createBuffer(1, Math.ceil(sampleRate * bufferDur), sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.hatFilter = context.createBiquadFilter();
        this.hatFilter.type = "bandpass";
        this.hatFilter.frequency.value = 8000;
        this.hatFilter.Q.value = 0.5;
        this.hatFilter.connect(destination);
    }
    ping(pattern, frameInMeasure, frameDuration) {
        const def = (0, beats_1.getBeatDefinition)(pattern);
        if (def.kick.includes(frameInMeasure))
            this.pingKick(frameDuration);
        if (def.hat.includes(frameInMeasure))
            this.pingHat(frameDuration);
    }
    scheduleSource(source, destination, peak, now, dur) {
        if (!this.context)
            return;
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        source.connect(gain);
        gain.connect(destination);
        source.onended = () => {
            source.disconnect();
            gain.disconnect();
        };
        source.start(now);
        source.stop(now + dur);
    }
    pingKick(frameDuration) {
        if (!this.context || !this.destination)
            return;
        const osc = this.context.createOscillator();
        const now = this.context.currentTime;
        const dur = Math.min(frameDuration, 0.3);
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + dur * 0.5);
        this.scheduleSource(osc, this.destination, 0.8, now, dur);
    }
    pingHat(frameDuration) {
        if (!this.context || !this.noiseBuffer || !this.hatFilter)
            return;
        const source = this.context.createBufferSource();
        source.buffer = this.noiseBuffer;
        const now = this.context.currentTime;
        const dur = Math.min(frameDuration * 0.7, 0.1);
        this.scheduleSource(source, this.hatFilter, 0.3, now, dur);
    }
    disconnect() {
        var _a;
        (_a = this.hatFilter) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.hatFilter = undefined;
        this.context = undefined;
        this.destination = undefined;
        this.noiseBuffer = undefined;
    }
}
exports.Drum = Drum;

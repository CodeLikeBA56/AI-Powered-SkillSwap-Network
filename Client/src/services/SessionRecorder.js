const blobToB64 = (blob) => new Promise((res, rej) => { // Utility: blob <-> base64 string
  const reader = new FileReader();
  reader.onloadend = () => res(reader.result.split(',')[1]); // strip "data:*/*;base64,"
  reader.onerror = rej;
  reader.readAsDataURL(blob);
});

const LS_KEY = 'recording_chunks_v1'; // Storage key

const b64ToBlob = (b64, mime = 'video/webm') => {
  const binary = atob(b64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

export class RecorderWithStorage {
  constructor() {
    this.recorder = null;          // active MediaRecorder
    this.currentSegment = [];      // chunks for the segment being recorded
    this.segments = [];            // array of completed segment arrays
    this._readyPromise = this._restoreFromLocalStorage(); // load any previous crash/save
  }

  async ensureReady() {
    await this._readyPromise;
  }

  /** --- public API --- */
  start(stream) {
    if (!stream) return console.error('[Rec] no stream');

    if (this.recorder?.state === 'recording') {
      console.warn('[Rec] already recording'); return;
    }

    try {
      this.currentSegment = [];
      this.recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
    } catch (err) {
      console.error('[Rec] MediaRecorder failed:', err); return;
    }

    this.recorder.ondataavailable = async (e) => {
      if (e.data?.size) {
        this.currentSegment.push(e.data);
        try { await this._persistChunk(e.data); } catch {}
      }
    };

    this.recorder.onstop = () => {
      this.segments.push([...this.currentSegment]);
      this.currentSegment = [];
      console.log('[Rec] segment saved, total segments:', this.segments.length);
    };

    this.recorder.start();
    console.log('[Rec] recording started');
  }

  stop() {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
      this.recorder = null;
    } else {
      console.warn('[Rec] stop called but not recording');
    }
  }

  async finalize() { /** returns final Blob (or null) and clears localStorage cache */
    if (this.recorder?.state === 'recording') {
      console.warn('[Rec] stop before finalize'); return null;
    }
    const allBlobs = this.segments.flat();
    if (allBlobs.length === 0) return null;
    const blob = new Blob(allBlobs, { type: allBlobs[0].type || 'video/webm' });
    localStorage.removeItem(LS_KEY); // done ▶ clear cache
    console.log('[Rec] final blob ready', (blob.size / 1024 / 1024).toFixed(1), 'MB');
    return blob;                     // caller can POST this to MongoDB / backend
  }

  async getPreviewBlob() {
    if (this.recorder?.state === 'recording') {
      console.warn('[Rec] Cannot generate preview while recording');
      return null;
    }

    const allBlobs = this.segments.flat();
    if (allBlobs.length === 0) return null;

    const blob = new Blob(allBlobs, { type: allBlobs[0].type || 'video/webm' });
    console.log('[Rec] Preview blob generated', (blob.size / 1024 / 1024).toFixed(1), 'MB');
    return blob;
  }

  async _persistChunk(blob) {
    try {
      const b64 = await blobToB64(blob);
      const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      arr.push(b64);
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
    } catch (err) {
      console.warn('[Rec] localStorage full or inaccessible – chunk not saved');
    }
  }

  async _restoreFromLocalStorage() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      const blobs = await Promise.all(arr.map(b64 => b64ToBlob(b64)));
      if (blobs.length) {
        this.segments.push(blobs);   // treat as one segment
        console.log('[Rec] restored', blobs.length, 'chunks from previous session');
      }
    } catch (err) {
      console.error('[Rec] failed to restore chunks', err);
      localStorage.removeItem(LS_KEY);
    }
  }
}

export default new RecorderWithStorage();
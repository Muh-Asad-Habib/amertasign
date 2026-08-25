/**
 * Halaman tracker MediaPipe untuk WebView — kamera + HandLandmarker berjalan
 * DI PERANGKAT, mengirim landmark ke React Native lewat postMessage.
 *
 * Dimuat dengan `baseUrl` = URL backend (https) sehingga:
 * - origin halaman = origin API → secure context → getUserMedia diizinkan;
 * - aset MediaPipe bisa diambil dari origin (`/mediapipe/*`, tersedia di
 *   produksi) dengan fallback CDN (pola sama dgn web lib/mediapipe.ts).
 *
 * Pesan page → RN (JSON):
 *   { type:'frame',  hands:[{handedness,score,landmarks:[{x,y,z}x21]}], now, fps }
 *   { type:'status', phase:'loading'|'ready'|'camera-on'|'error', message? }
 * Perintah RN → page (injectJavaScript):
 *   window.__live.setFacing('front'|'back'); window.__live.setTorch(bool);
 */

/** Versi dikunci sama dengan @mediapipe/tasks-vision yang dipakai web. */
const TASKS_VISION_VERSION = '0.10.35';

export function buildLiveTrackerHtml(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
<style>
  html, body { margin:0; padding:0; height:100%; background:#0b1020; overflow:hidden; }
  #stage { position:fixed; inset:0; }
  video, canvas { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .mirror { transform: scaleX(-1); }
  #msg {
    position:absolute; left:12px; right:12px; bottom:12px; text-align:center;
    color:#c9d2ee; font:500 13px system-ui, sans-serif; text-shadow:0 1px 3px rgba(0,0,0,.8);
    pointer-events:none;
  }
</style>
</head>
<body>
<div id="stage">
  <video id="v" playsinline muted autoplay></video>
  <canvas id="c"></canvas>
  <div id="msg">Menyiapkan deteksi tangan…</div>
</div>
<script>
(function () {
  'use strict';
  var RN = window.ReactNativeWebView;
  function send(obj) { try { if (RN) RN.postMessage(JSON.stringify(obj)); } catch (e) {} }
  function status(phase, message) {
    send({ type: 'status', phase: phase, message: message || '' });
    var el = document.getElementById('msg');
    if (el) el.textContent = message || '';
  }
  window.onerror = function (message) { status('error', 'Tracker error: ' + message); };

  var VERSION = '${TASKS_VISION_VERSION}';
  // Bundel JS API tasks-vision — dari CDN (origin backend tidak meng-hostnya).
  var BUNDLE_URLS = [
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + VERSION + '/vision_bundle.mjs',
    'https://unpkg.com/@mediapipe/tasks-vision@' + VERSION + '/vision_bundle.mjs'
  ];
  // Aset wasm + model: origin dulu (produksi punya /mediapipe/*), lalu CDN —
  // urutan & fallback sama dengan web (lib/mediapipe.ts). Khusus origin
  // quick-tunnel (backend uji), origin tidak meng-host aset → CDN duluan.
  var ASSET_SOURCES = [
    { wasm: location.origin + '/mediapipe/wasm',
      model: location.origin + '/mediapipe/models/hand_landmarker.task' },
    { wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + VERSION + '/wasm',
      model: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task' }
  ];
  if (/\\.(trycloudflare\\.com|devtunnels\\.ms)$/.test(location.hostname)) {
    ASSET_SOURCES.reverse();
  }

  var video = document.getElementById('v');
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var landmarker = null;
  var visionApi = null;
  var stream = null;
  var track = null;
  var facing = 'user';
  var lastVideoTime = -1;
  var lastPostAt = 0;
  var lastEmptyPostAt = 0;
  var frameTimes = [];

  // Kerangka jari untuk overlay (indeks landmark MediaPipe Hands).
  var CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

  function loadBundle(index) {
    if (index >= BUNDLE_URLS.length) {
      return Promise.reject(new Error('Semua sumber bundel MediaPipe gagal dimuat.'));
    }
    return import(BUNDLE_URLS[index]).catch(function () { return loadBundle(index + 1); });
  }

  function createLandmarker(vision) {
    var lastError = null;
    var chain = Promise.reject();
    ASSET_SOURCES.forEach(function (source) {
      ['GPU', 'CPU'].forEach(function (delegate) {
        chain = chain.catch(function () {
          return vision.FilesetResolver.forVisionTasks(source.wasm).then(function (fileset) {
            return vision.HandLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: source.model, delegate: delegate },
              runningMode: 'VIDEO',
              numHands: 2,
              minHandDetectionConfidence: 0.3,
              minHandPresenceConfidence: 0.3,
              minTrackingConfidence: 0.3
            });
          });
        }).catch(function (error) { lastError = error; return Promise.reject(error); });
      });
    });
    return chain.catch(function () {
      throw lastError || new Error('HandLandmarker gagal dibuat.');
    });
  }

  function applyMirror() {
    var mirrored = facing === 'user';
    video.classList.toggle('mirror', mirrored);
    canvas.classList.toggle('mirror', mirrored);
  }

  function startCamera() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
      track = null;
    }
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    }).then(function (mediaStream) {
      stream = mediaStream;
      track = mediaStream.getVideoTracks()[0] || null;
      video.srcObject = mediaStream;
      applyMirror();
      lastVideoTime = -1;
      return video.play();
    }).then(function () {
      status('camera-on', '');
    });
  }

  function drawHands(hands) {
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < hands.length; i++) {
      var pts = hands[i].landmarks;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.95)';
      ctx.lineWidth = Math.max(2, w / 320);
      for (var j = 0; j < CONNECTIONS.length; j++) {
        var a = pts[CONNECTIONS[j][0]];
        var b = pts[CONNECTIONS[j][1]];
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      var r = Math.max(2.5, w / 300);
      for (var k = 0; k < pts.length; k++) {
        ctx.beginPath();
        ctx.arc(pts[k].x * w, pts[k].y * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function round4(value) { return Math.round(value * 10000) / 10000; }

  function toHands(result) {
    var hands = [];
    for (var i = 0; i < result.landmarks.length; i++) {
      var category = (result.handedness[i] && result.handedness[i][0]) || null;
      var raw = result.landmarks[i];
      var landmarks = [];
      for (var j = 0; j < raw.length; j++) {
        landmarks.push({ x: round4(raw[j].x), y: round4(raw[j].y), z: round4(raw[j].z || 0) });
      }
      hands.push({
        handedness: (category && category.categoryName) || 'Right',
        score: category ? round4(category.score) : 1,
        landmarks: landmarks
      });
    }
    return hands;
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!landmarker || video.readyState < 2) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    var now = performance.now();
    if (video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;

    var detection;
    try {
      detection = landmarker.detectForVideo(video, now);
    } catch (e) {
      return;
    }
    var hands = toHands(detection);
    drawHands(hands);

    frameTimes.push(now);
    while (frameTimes.length > 0 && frameTimes[0] <= now - 1000) frameTimes.shift();

    // Hemat bridge: frame bertangan maks ~25 fps, frame kosong ~8 fps
    // (frame kosong tetap perlu utk deteksi jeda segmen kata di sisi RN).
    if (hands.length > 0) {
      if (now - lastPostAt < 40) return;
      lastPostAt = now;
    } else {
      if (now - lastEmptyPostAt < 120) return;
      lastEmptyPostAt = now;
      lastPostAt = 0;
    }
    send({ type: 'frame', hands: hands, now: now, fps: frameTimes.length });
  }

  // Perintah dari React Native.
  window.__live = {
    setFacing: function (value) {
      var next = value === 'back' ? 'environment' : 'user';
      if (next === facing) return;
      facing = next;
      startCamera().catch(function (error) {
        status('error', 'Kamera gagal dibuka: ' + (error && error.message ? error.message : error));
      });
    },
    setTorch: function (on) {
      if (!track || !track.applyConstraints) return;
      track.applyConstraints({ advanced: [{ torch: !!on }] }).catch(function () {
        send({ type: 'status', phase: 'torch-unsupported', message: '' });
      });
    }
  };

  status('loading', 'Memuat model deteksi tangan…');
  loadBundle(0).then(function (vision) {
    visionApi = vision;
    return createLandmarker(vision);
  }).then(function (created) {
    landmarker = created;
    status('ready', 'Membuka kamera…');
    return startCamera();
  }).then(function () {
    status('camera-on', '');
    requestAnimationFrame(loop);
  }).catch(function (error) {
    status('error', (error && error.message) ? error.message : 'Gagal menyiapkan deteksi.');
  });
})();
</script>
</body>
</html>`;
}

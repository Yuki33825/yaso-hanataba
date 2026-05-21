// Weeds Dictionary (Includes note-based detailed insights)
        const WEEDS = {
            clover: {
                id: 'clover',
                name: 'シロツメクサ',
                scientific: 'Trifolium repens',
                role: '主役 / フォーカル',
                desc: '丸くて白い花が可憐な野良の主役。首飾りや花冠でも親しまれています。',
                points: 10,
                color: '#DFE7DF',
                badgeText: '🍀 これ積んで！',
                caution: '花の根元や細部に小さなアブラムシが隠れていることがあります。やわらかい歯ブラシや筆に水をつけて優しく払い落としましょう。',
                mizuage: '茎はしっかりしているため比較的簡単です。生ける前に茎の先をハサミで新しくカットしてください。',
                manner: '芝生や空き地などに広く自生しています。人工的に整備・管理された公園内での採取は避けましょう。'
            },
            nazuna: {
                id: 'nazuna',
                name: 'ナズナ',
                scientific: 'Capsella bursa-pastoris',
                role: '脇役 / フィラー',
                desc: '別名ペンペン草。ハート型の葉（実）が連なっており、花と花の隙間を優しく埋める名脇役。',
                points: 5,
                color: '#8EAC90',
                badgeText: '🌱 これ積んで！',
                caution: '草むらに密集して生えるため、細かい実の隙間に虫が潜んでいることがあります。バケツの水の中で振り洗いすると綺麗になります。',
                mizuage: '野草の中では極めて頑丈で水揚げが良く、長持ちします。茎が細いため、麻紐で束ねる際も潰さないよう注意。',
                manner: '道端や舗装の隙間によく生えていますが、犬などの散歩ルートを避けて綺麗な場所のものを選びましょう。'
            },
            tanpopo: {
                id: 'tanpopo',
                name: 'タンポポ',
                scientific: 'Taraxacum',
                role: 'アクセント',
                desc: '野に輝く太陽の黄色。一輪入るだけで、花束全体がぱっと明るく華やかになります。',
                points: 15,
                color: '#E6C229',
                badgeText: '🌼 これ積んで！',
                caution: '茎を折ると断面から粘り気のある白い乳液が出ます。触れるとかぶれることがあるため、触ってしまったらすぐ水で洗いましょう。',
                mizuage: '非常に水が下がりやすく萎びやすいため、摘み取ったらすぐ根元に濡らしたティッシュを巻くか水に浸して持ち帰ります。',
                manner: '排気ガスを浴びやすい道路沿いを避け、日当たりの良い安全な河川敷などで採取するのが理想です。'
            },
            enokorogusa: {
                id: 'enokorogusa',
                name: 'エノコログサ',
                scientific: 'Setaria viridis',
                role: 'グリーン / 動き',
                desc: 'ネコじゃらしとして愛されるイネ科の野草。フワフワした穂が光を浴びて輝き、立体感を与えます。',
                points: 8,
                color: '#A6BCA9',
                badgeText: '🌾 これ積んで！',
                caution: 'イネ科の植物アレルギーをお持ちの方は、取り扱い時にクシャミや目のかゆみなどのアレルギー症状に注意してください。',
                mizuage: '乾燥に極めて強く、水揚げも良好です。ハサミで茎を斜めに大きく切り、水を吸い上げる断面積を広げて生けます。',
                manner: '枯れて茶色く乾燥したものではなく、青々と瑞々しい若緑色のものを選ぶと、花束が生き生きとします。'
            }
        };

        // State Management
        let state = {
            counts: {
                clover: 0,
                nazuna: 0,
                tanpopo: 0,
                enokorogusa: 0
            },
            total: 0,
            activeBadges: [],
            cameraStream: null,
            currentFacingMode: 'environment',
            videoDevices: [],
            isDrawerExpanded: false,
            isScaleVisible: false,
            selectedWeedId: null,
            isModelLoaded: true // Always true now since we use API
        };

        // QR Code Setup
        window.addEventListener('DOMContentLoaded', () => {
            // Determine public access URL
            let publicUrl = `http://172.20.10.7:8080/`;
            if (window.TUNNEL_URL) {
                publicUrl = window.TUNNEL_URL;
            } else if (window.location.protocol !== 'file:') {
                publicUrl = window.location.origin + window.location.pathname;
            }
            
            // Set URL text
            document.getElementById('desktop-url-text').innerText = publicUrl;
            
            // Draw QR Code
            new QRious({
                element: document.getElementById('panel-qr-canvas'),
                value: publicUrl,
                size: 200,
                background: '#FAF9F6',
                foreground: '#2F3E32'
            });

            // Pre-draw millimeter scale
            generateScaleTicks();
        });

        // Generate Scale tick marks dynamically
        function generateScaleTicks() {
            const scaleTicks = document.getElementById('scaleTicks');
            // CSS 1cm corresponds to ~37.79px (at standard 96dpi)
            const cmInPx = 37.79;

            for (let i = 0; i <= 18; i++) {
                const tick = document.createElement('div');
                tick.style.position = 'absolute';
                tick.style.bottom = `${i * cmInPx}px`;
                tick.style.left = '0';
                tick.style.width = i % 5 === 0 ? '75%' : '45%';
                tick.style.height = '1px';
                tick.style.backgroundColor = i % 5 === 0 ? 'var(--color-yellow)' : 'rgba(255, 255, 255, 0.3)';

                if (i % 5 === 0 || i === 0 || i === 12 || i === 15 || i === 18) {
                    tick.style.height = '1.5px';
                    const num = document.createElement('span');
                    num.style.position = 'absolute';
                    num.style.right = '4px';
                    num.style.top = '-6px';
                    num.style.fontSize = '0.55rem';
                    num.style.fontFamily = 'var(--font-sans)';
                    num.style.color = i % 5 === 0 ? 'var(--color-yellow)' : 'var(--color-white)';
                    num.innerText = `${i}cm`;
                    tick.appendChild(num);
                }
                scaleTicks.appendChild(tick);

                // Add millimeters ticks
                if (i < 18) {
                    for (let j = 1; j < 10; j++) {
                        if (j === 5) continue; // Half cm is represented by longer lines in some rulers, skip or make 55%
                        const mTick = document.createElement('div');
                        mTick.style.position = 'absolute';
                        mTick.style.bottom = `${(i + j * 0.1) * cmInPx}px`;
                        mTick.style.left = '0';
                        mTick.style.width = j === 5 ? '55%' : '25%';
                        mTick.style.height = '0.5px';
                        mTick.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        scaleTicks.appendChild(mTick);
                    }
                    // 5mm tick line
                    const halfTick = document.createElement('div');
                    halfTick.style.position = 'absolute';
                    halfTick.style.bottom = `${(i + 0.5) * cmInPx}px`;
                    halfTick.style.left = '0';
                    halfTick.style.width = '55%';
                    halfTick.style.height = '0.8px';
                    halfTick.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                    scaleTicks.appendChild(halfTick);
                }
            }
        }

        // Toggle ruler visibility
        function togglePhysicalScale() {
            const scale = document.getElementById('physicalScale');
            const btn = document.getElementById('scaleToggleBtn');
            state.isScaleVisible = !state.isScaleVisible;

            if (state.isScaleVisible) {
                scale.classList.add('visible');
                btn.classList.add('active');
                btn.innerHTML = '📐 定規を非表示';
            } else {
                scale.classList.remove('visible');
                btn.classList.remove('active');
                btn.innerHTML = '📐 定規を表示';
            }
        }

        // Synthesize Sound Effects using Web Audio API
        let audioCtx = null;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        function playPluckSound() {
            initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
            
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
            
            // Noise crunch
            const bufferSize = audioCtx.sampleRate * 0.02;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(900, now);
            
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.18, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
            
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            
            noise.start(now);
            noise.stop(now + 0.02);
        }

        function playChimeSound() {
            initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const now = audioCtx.currentTime;
            const chord = [392.00, 523.25, 587.33, 783.99]; // G4, C5, D5, G5
            
            chord.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                
                gain.gain.setValueAtTime(0, now + idx * 0.05);
                gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.6);
            });
        }

        // Initialize App
        function initApp() {
            document.getElementById('welcomeScreen').classList.add('fade-out');
            document.getElementById('mainScreen').classList.remove('hidden');
            
            initAudio();
            
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    state.videoDevices = devices.filter(d => d.kind === 'videoinput');
                    if (state.videoDevices.length > 1) {
                        document.getElementById('switchCameraBtn').classList.remove('hidden');
                    }
                });
            }

            // Attempt actual camera back lens
            startCamera();

            // Setup canvas fallback
            setupSimulatorCanvas();

            // Setup drawer touch/mouse handlers
            setupDrawerDragging();
        }

        // Start Camera Capture
        function startCamera() {
            const scanStatus = document.getElementById('scanStatusText');
            const scannerDot = document.getElementById('scannerDot');
            
            scanStatus.innerText = "Camera Ready";
            scannerDot.classList.remove('loading');

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showSimulatorOnly();
                return;
            }

            const constraints = {
                video: {
                    facingMode: state.currentFacingMode,
                    width: { ideal: 720 },
                    height: { ideal: 1280 }
                },
                audio: false
            };

            navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                state.cameraStream = stream;
                const videoEl = document.getElementById('camera-video');
                videoEl.srcObject = stream;
                videoEl.classList.remove('hidden');
                
                scanStatus.innerText = "Ready to Scan";
                
                document.getElementById('simulator-canvas').style.opacity = '0.25';
            })
            .catch(err => {
                console.warn("Camera access blocked: ", err);
                showSimulatorOnly();
            });
        }

        function showSimulatorOnly() {
            document.getElementById('camera-video').classList.add('hidden');
            document.getElementById('simulator-canvas').style.opacity = '1';
            document.getElementById('scanStatusText').innerText = "Simulated Scan Active";
        }

        function toggleCamera() {
            if (state.cameraStream) {
                state.cameraStream.getTracks().forEach(t => t.stop());
            }
            state.currentFacingMode = state.currentFacingMode === 'environment' ? 'user' : 'environment';
            startCamera();
        }

        // Pl@ntNet API Integration
        async function captureAndIdentifyWeed() {
            const videoEl = document.getElementById('camera-video');
            if (videoEl.classList.contains('hidden') || videoEl.readyState !== 4) {
                // Simulator active: just spawn a random badge
                badgeSpawner();
                return;
            }

            const scanStatus = document.getElementById('scanStatusText');
            const scannerDot = document.getElementById('scannerDot');
            
            scanStatus.innerText = "Pl@ntNet API 分析中...";
            scannerDot.classList.add('loading');
            
            // Play a small sound for scan start
            playPluckSound();

            try {
                // 1. Capture frame to full-resolution canvas
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth;
                canvas.height = videoEl.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                
                // 2. Convert to Blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
                
                // 3. Prepare FormData
                const formData = new FormData();
                formData.append('organs', 'auto');
                formData.append('images', blob, 'capture.jpg');
                
                // 4. Send to Pl@ntNet API
                const apiKey = '2b10qZpgPns3L6d8078Ad2tzu';
                const apiUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                
                const data = await response.json();
                
                // 5. Parse Results
                let detectedId = null;
                
                if (data.results && data.results.length > 0) {
                    const topResult = data.results[0];
                    const scientificName = topResult.species.scientificNameWithoutAuthor.toLowerCase();
                    const score = topResult.score;
                    
                    console.log("Pl@ntNet Top Result:", topResult);
                    
                    if (score > 0.05) { // Threshold
                        if (scientificName.includes('trifolium')) {
                            detectedId = 'clover';
                        } else if (scientificName.includes('taraxacum')) {
                            detectedId = 'tanpopo';
                        } else if (scientificName.includes('capsella bursa-pastoris')) {
                            detectedId = 'nazuna';
                        } else if (scientificName.includes('setaria')) {
                            detectedId = 'enokorogusa';
                        } else {
                            // Map other generic weeds to our closest approximations
                            detectedId = Math.random() > 0.5 ? 'enokorogusa' : 'nazuna';
                        }
                    }
                }
                
                if (detectedId) {
                    // Find a rough centroid based on color to place the AR badge
                    trackColorAndSpawn(detectedId);
                    scanStatus.innerText = "検知完了！";
                } else {
                    scanStatus.innerText = "見つかりませんでした";
                }
                
                setTimeout(() => { scanStatus.innerText = "Ready to Scan"; }, 3000);

            } catch (err) {
                console.error("Pl@ntNet Error:", err);
                scanStatus.innerText = "通信エラー";
                setTimeout(() => { scanStatus.innerText = "Ready to Scan"; }, 3000);
                // Fallback to spawn a random badge on error for demo purposes
                badgeSpawner();
            } finally {
                scannerDot.classList.remove('loading');
            }
        }

        // Color tracking (find where the weed is located in camera view)
        function trackColorAndSpawn(weedId) {
            const videoEl = document.getElementById('camera-video');
            const hCanvas = document.getElementById('hidden-canvas');
            const hCtx = hCanvas.getContext('2d');
            
            // Draw video crop onto small helper canvas
            hCtx.drawImage(videoEl, 0, 0, hCanvas.width, hCanvas.height);
            const imgData = hCtx.getImageData(0, 0, hCanvas.width, hCanvas.height);
            const data = imgData.data;

            let sumX = 0;
            let sumY = 0;
            let count = 0;

            // Target color threshold definitions
            const isYellow = (r, g, b) => r > 150 && g > 130 && b < 100;
            const isGreen = (r, g, b) => g > r * 1.15 && g > b * 1.15 && g > 60;
            const isWhite = (r, g, b) => r > 190 && g > 190 && b > 190;

            for (let y = 0; y < hCanvas.height; y++) {
                for (let x = 0; x < hCanvas.width; x++) {
                    const idx = (y * hCanvas.width + x) * 4;
                    const r = data[idx];
                    const g = data[idx+1];
                    const b = data[idx+2];

                    let matched = false;
                    if (weedId === 'tanpopo') {
                        matched = isYellow(r, g, b);
                    } else if (weedId === 'clover') {
                        matched = isWhite(r, g, b) || isGreen(r, g, b);
                    } else {
                        matched = isGreen(r, g, b);
                    }

                    if (matched) {
                        sumX += x;
                        sumY += y;
                        count++;
                    }
                }
            }

            // Viewport container size
            const viewCont = document.getElementById('viewportContainer');
            const rect = viewCont.getBoundingClientRect();

            let targetX, targetY;

            if (count > 15) {
                // We found a matching color cluster! Place badge at centroid
                const avgX = sumX / count;
                const avgY = sumY / count;
                
                // Map coordinates from small canvas (80x60) to actual viewport size
                targetX = (avgX / hCanvas.width) * rect.width;
                targetY = (avgY / hCanvas.height) * rect.height;
            } else {
                // Fallback: Place badge at random center coordinates
                targetX = Math.random() * (rect.width * 0.5) + (rect.width * 0.25);
                targetY = Math.random() * (rect.height * 0.4) + (rect.height * 0.25);
            }

            // Spawn the target badge
            spawnWeedBadgeAt(weedId, targetX, targetY);
        }

        // Spawn a Floating AR Weed Badge at coordinate
        function spawnWeedBadgeAt(weedId, x, y) {
            // Keep maximum of 2 badges to avoid crowding
            if (state.activeBadges.length >= 2) {
                // If a badge of the same type exists, let's smooth transition its position
                const existing = state.activeBadges.find(b => b.type === weedId);
                if (existing) {
                    const el = document.getElementById(existing.id);
                    if (el) {
                        // Smoothly interpolate position (Linear Interpolation)
                        existing.x = existing.x * 0.6 + x * 0.4;
                        existing.y = existing.y * 0.5 + y * 0.5;
                        el.style.left = existing.x + 'px';
                        el.style.top = existing.y + 'px';
                    }
                    return;
                }
                return;
            }

            const weedData = WEEDS[weedId];
            const badgeId = 'badge_' + Date.now() + '_' + Math.floor(Math.random() * 100);

            const badgeDiv = document.createElement('div');
            badgeDiv.className = 'ar-badge';
            badgeDiv.id = badgeId;
            badgeDiv.style.left = x + 'px';
            badgeDiv.style.top = y + 'px';
            
            // Tap anywhere on the badge opens details, except picking directly (which is now in details modal)
            badgeDiv.onclick = (e) => {
                e.stopPropagation();
                openGuideModal(weedId, badgeId, x, y);
            };

            const svgTemplate = document.getElementById('tpl-' + weedId).cloneNode(true);
            svgTemplate.removeAttribute('id');

            badgeDiv.innerHTML = `
                <div class="ar-target-ring"></div>
                <div class="ar-card">
                    <div class="ar-weed-icon">
                        ${svgTemplate.outerHTML}
                    </div>
                    <div class="ar-info">
                        <div class="ar-name">${weedData.name}</div>
                        <div class="ar-tag-label">${weedData.badgeText}</div>
                    </div>
                </div>
            `;

            document.getElementById('arContainer').appendChild(badgeDiv);
            
            setTimeout(() => {
                badgeDiv.classList.add('visible');
            }, 50);

            state.activeBadges.push({
                id: badgeId,
                x: x,
                y: y,
                type: weedId
            });
        }

        // Virtual Spawner backup (runs when camera is offline, e.g. PC simulator)
        function badgeSpawner() {
            if (state.activeBadges.length >= 2) return;

            const weedKeys = Object.keys(WEEDS);
            const randomKey = weedKeys[Math.floor(Math.random() * weedKeys.length)];
            
            const viewCont = document.getElementById('viewportContainer');
            const rect = viewCont.getBoundingClientRect();
            
            const randX = Math.random() * (rect.width * 0.6) + (rect.width * 0.2);
            const randY = Math.random() * (rect.height * 0.4) + (rect.height * 0.25);

            spawnWeedBadgeAt(randomKey, randX, randY);
        }

        // Open Botanical detail guide card modal
        function openGuideModal(weedId, badgeId, startX, startY) {
            initAudio();
            const data = WEEDS[weedId];
            state.selectedWeedId = weedId;
            
            // Set modal info
            document.getElementById('guideJpName').innerText = data.name;
            document.getElementById('guideScName').innerText = data.scientific;
            document.getElementById('guideRoleTag').innerText = data.role;
            document.getElementById('guidePointsTag').innerText = `獲得: ${data.points}pt`;
            document.getElementById('guideMainDesc').innerText = data.desc;
            
            // Juneray's safety rules & tips
            document.getElementById('guideCautionText').innerText = data.caution;
            document.getElementById('guideMizuageText').innerText = data.mizuage;
            document.getElementById('guideMannerText').innerText = data.manner;

            // Set botanical illustration inside modal
            const iconContainer = document.getElementById('guideDetailIcon');
            iconContainer.innerHTML = '';
            const svgClone = document.getElementById('tpl-' + weedId).cloneNode(true);
            svgClone.removeAttribute('id');
            iconContainer.appendChild(svgClone);

            // Bind "Pick" action to button
            const pickBtn = document.getElementById('guidePickBtn');
            pickBtn.onclick = () => {
                closeGuideModal();
                executeWeedPicking(weedId, badgeId, startX, startY);
            };

            document.getElementById('guideModal').classList.add('visible');
        }

        function closeGuideModal() {
            document.getElementById('guideModal').classList.remove('visible');
        }

        // Complete the weed plucking process
        function executeWeedPicking(weedId, badgeId, startX, startY) {
            playPluckSound();

            // Animate badge removal
            const badgeEl = document.getElementById(badgeId);
            if (badgeEl) {
                badgeEl.style.transform = 'translate(-50%, -50%) scale(0.5)';
                badgeEl.classList.remove('visible');
                setTimeout(() => badgeEl.remove(), 400);
            }

            state.activeBadges = state.activeBadges.filter(b => b.id !== badgeId);
            
            // Trigger particle fly
            spawnFlyingParticle(weedId, startX, startY);

            setTimeout(() => {
                state.counts[weedId]++;
                state.total++;
                
                playChimeSound();
                updateUI();
                dropWeedInVase(weedId);
            }, 650);
        }

        // Animate flying particle to bottom vase
        function spawnFlyingParticle(weedId, x, y) {
            const container = document.getElementById('mainScreen');
            const particle = document.createElement('div');
            particle.className = 'flying-weed-particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            const svgTemplate = document.getElementById('tpl-' + weedId).cloneNode(true);
            svgTemplate.removeAttribute('id');
            particle.appendChild(svgTemplate);

            container.appendChild(particle);

            const frameRect = document.getElementById('appFrame').getBoundingClientRect();
            const targetX = frameRect.width * 0.25; 
            const targetY = frameRect.height - 120; 

            setTimeout(() => {
                particle.style.left = targetX + 'px';
                particle.style.top = targetY + 'px';
                particle.style.transform = 'scale(0.3) rotate(120deg)';
                particle.style.opacity = '0.3';
            }, 50);

            setTimeout(() => {
                particle.remove();
            }, 800);
        }

        // Drop SVG element inside the virtual vase
        function dropWeedInVase(weedId) {
            const weedsArea = document.getElementById('bouquetWeedsArea');
            document.getElementById('vaseEmptyText').style.opacity = '0';

            const container = document.createElement('div');
            container.className = 'weed-svg-item vase-weed-' + weedId;
            
            const rot = (Math.random() * 40 - 20).toFixed(1); 
            const sc = (Math.random() * 0.25 + 0.65).toFixed(2); 
            const tx = (Math.random() * 50 - 25).toFixed(1); 
            const ty = (Math.random() * 15 - 5).toFixed(1);  
            
            container.style.setProperty('--rot', rot + 'deg');
            container.style.setProperty('--sc', sc);
            container.style.setProperty('--tx', `calc(-50% + ${tx}px)`);
            container.style.setProperty('--ty', `${ty}px`);
            
            const weedSvg = document.getElementById('tpl-' + weedId).cloneNode(true);
            weedSvg.removeAttribute('id');
            container.appendChild(weedSvg);

            if (weedId === 'enokorogusa') {
                container.style.zIndex = Math.floor(Math.random() * 3) + 1; 
            } else if (weedId === 'clover') {
                container.style.zIndex = Math.floor(Math.random() * 5) + 15; 
            } else {
                container.style.zIndex = Math.floor(Math.random() * 10) + 5; 
            }

            weedsArea.appendChild(container);
        }

        // Open Safety / note handbook modal
        function openHandbook() {
            initAudio();
            document.getElementById('handbookModal').classList.add('visible');
        }

        function closeHandbook() {
            document.getElementById('handbookModal').classList.remove('visible');
        }

        // Reset Bouquet
        function resetBouquet() {
            state.counts = { clover: 0, nazuna: 0, tanpopo: 0, enokorogusa: 0 };
            state.total = 0;
            
            const weedsArea = document.getElementById('bouquetWeedsArea');
            weedsArea.innerHTML = '';
            
            document.getElementById('vaseEmptyText').style.opacity = '1';
            
            playPluckSound();
            updateUI();
        }

        // Drawer sliding dragging logic
        function promptCount(weedId) {
            const weedData = WEEDS[weedId];
            const current = state.counts[weedId];
            const result = prompt(`${weedData.name}の数を変更しますか？\n(半角数字で入力してください)`, current);
            
            if (result !== null && result.trim() !== '') {
                const num = parseInt(result, 10);
                if (!isNaN(num) && num >= 0) {
                    const diff = num - current;
                    state.counts[weedId] = num;
                    state.total += diff;
                    
                    if (diff > 0) {
                        for (let i = 0; i < diff; i++) dropWeedInVase(weedId);
                    } else if (diff < 0) {
                        const weedsArea = document.getElementById('bouquetWeedsArea');
                        const items = weedsArea.querySelectorAll('.vase-weed-' + weedId);
                        for (let i = 0; i < Math.min(-diff, items.length); i++) {
                            items[i].remove();
                        }
                        if (weedsArea.children.length === 0) {
                            document.getElementById('vaseEmptyText').style.opacity = '1';
                        }
                    }
                    updateUI();
                }
            }
        }

        function setupDrawerDragging() {
            const drawer = document.getElementById('dashboardDrawer');
            const header = document.getElementById('drawerHeader');
            
            let startY = 0;
            let currentTranslateY = 0;
            let isDragging = false;
            
            const minTranslate = 490 - 84; // collapsed height

            header.addEventListener('click', (e) => {
                if (isDragging) return;
                toggleDrawer();
            });

            header.addEventListener('touchstart', dragStart, { passive: true });
            window.addEventListener('touchmove', dragMove, { passive: false });
            window.addEventListener('touchend', dragEnd);

            header.addEventListener('mousedown', dragStart);
            window.addEventListener('mousemove', dragMove);
            window.addEventListener('mouseup', dragEnd);

            function dragStart(e) {
                initAudio();
                isDragging = true;
                startY = e.touches ? e.touches[0].clientY : e.clientY;
                drawer.style.transition = 'none';
            }

            function dragMove(e) {
                if (!isDragging) return;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const deltaY = clientY - startY;
                
                let targetY = (state.isDrawerExpanded ? 0 : minTranslate) + deltaY;
                
                if (targetY < 0) targetY = -Math.pow(-targetY, 0.7); // spring
                if (targetY > minTranslate) targetY = minTranslate + Math.pow(targetY - minTranslate, 0.7);
                
                drawer.style.transform = `translateY(${targetY}px)`;
                currentTranslateY = targetY;
            }

            function dragEnd() {
                if (!isDragging) return;
                isDragging = false;
                
                drawer.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
                
                if (currentTranslateY < minTranslate / 2) {
                    expandDrawer();
                } else {
                    collapseDrawer();
                }
            }
        }

        function toggleDrawer() {
            if (state.isDrawerExpanded) {
                collapseDrawer();
            } else {
                expandDrawer();
            }
        }

        function expandDrawer() {
            const drawer = document.getElementById('dashboardDrawer');
            drawer.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            drawer.style.transform = 'translateY(0px)';
            drawer.classList.add('expanded');
            state.isDrawerExpanded = true;
        }

        function collapseDrawer() {
            const drawer = document.getElementById('dashboardDrawer');
            drawer.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            drawer.style.transform = 'translateY(406px)'; // translateY(490 - 84)
            drawer.classList.remove('expanded');
            state.isDrawerExpanded = false;
        }

        // Update indicators, progress bars, AI text
        function updateUI() {
            document.getElementById('totalCountBadge').innerText = `${state.total} 本`;
            
            const giftBtn = document.getElementById('giftBtn');
            giftBtn.disabled = state.total === 0;

            const vaseCont = document.getElementById('vaseContainer');
            if (vaseCont) {
                if (state.total > 0) {
                    vaseCont.classList.add('visible');
                } else {
                    vaseCont.classList.remove('visible');
                }
            }

            Object.keys(WEEDS).forEach(key => {
                const count = state.counts[key];
                const countEl = document.getElementById('count-' + key);
                const itemEl = document.getElementById('item-' + key);
                
                if (parseInt(countEl.innerText) !== count) {
                    countEl.innerText = count;
                    countEl.classList.add('bump');
                    setTimeout(() => countEl.classList.remove('bump'), 200);
                }

                if (itemEl) {
                    if (count > 0) {
                        itemEl.classList.remove('hidden');
                    } else {
                        itemEl.classList.add('hidden');
                    }
                }

                const pct = Math.min((count / 6) * 100, 100);
                document.getElementById('bar-' + key).style.width = pct + '%';
            });

            updateAIAdvice();
        }

        // Emotional dynamic AI Advice
        function updateAIAdvice() {
            const adviceEl = document.getElementById('aiAdviceText');
            let text = "";

            const { clover, nazuna, tanpopo, enokorogusa } = state.counts;

            if (state.total === 0) {
                text = "まだ花束は空っぽです。足元の小さな美しさを探してみましょう。まずはシロツメクサやタンポポなど、主役になる花を手にとってみてください。";
            } else if (state.total === 1) {
                text = "最初の一本ですね。静かで美しい始まりです。次はそれを引き立てるナズナや、動きを出すエノコログサを合わせてみましょう。";
            } else {
                const flowersCount = clover + tanpopo;
                const greensCount = enokorogusa + nazuna;

                if (clover > 0 && tanpopo === 0 && greensCount === 0) {
                    text = "シロツメクサだけの素朴な花束ですね。少しエノコログサなどの「緑」を添えると、野原を吹き抜ける風のような立体感が生まれます。";
                } else if (tanpopo > 3 && greensCount === 0) {
                    text = "タンポポの黄色が陽だまりのように鮮やかです。ここにナズナを足すと、黄色の強さが和らぎ、可憐で落ち着いた表情になります。";
                } else if (greensCount > 4 && flowersCount === 0) {
                    text = "エノコログサとナズナが織りなす、瑞々しく涼やかなグリーンブーケです。シロツメクサを数本あしらうだけで、一気に主役が引き立ちます。";
                } else if (clover > 0 && tanpopo > 0 && greensCount === 0) {
                    text = "白と黄色のコントラストがとても愛らしいです。背景となる緑（エノコログサ）が数本加わると、より自然な野花の美しさが整います。";
                } else if (clover > 0 && nazuna > 0 && tanpopo > 0 && enokorogusa > 0) {
                    text = "素晴らしい調和です！主役、脇役、そして緑のバランスが整い、まるで朝露の降りた原っぱをそのまま手で束ねたような情緒を感じる花束になっています。";
                } else if (state.total >= 10) {
                    text = "とても立派で贅沢な野花の花束になりましたね。実用性はない、ただ美しいだけのもの。この愛おしい日常の一部を、大切な誰かに贈ってみませんか？";
                } else {
                    let elements = [];
                    if (clover > 0) elements.push("シロツメクサの白");
                    if (tanpopo > 0) elements.push("タンポポの黄色");
                    if (enokorogusa > 0) elements.push("エノコログサの穂");
                    if (nazuna > 0) elements.push("ナズナのハート型の葉");

                    text = `${elements.join('と')}が、優しく重なり合っています。`;
                    if (greensCount < flowersCount) {
                        text += " エノコログサなどのグリーンを少し足すと、花と花の間に優しい隙間が生まれます。";
                    } else {
                        text += " シロツメクサやタンポポの明るさを少し足して、全体の視点をフォーカスさせてみましょう。";
                    }
                }
            }

            // Fade transition
            adviceEl.style.opacity = '0';
            setTimeout(() => {
                adviceEl.innerText = text;
                adviceEl.style.opacity = '1';
            }, 300);
        }

        // Fallback Canvas weeds simulator loop
        let simCanvas = null;
        let simCtx = null;
        let simParticles = [];
        let simWeeds = [];

        function setupSimulatorCanvas() {
            simCanvas = document.getElementById('simulator-canvas');
            simCtx = simCanvas.getContext('2d');
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // Particles (Pollen/Spores)
            for (let i = 0; i < 30; i++) {
                simParticles.push({
                    x: Math.random() * simCanvas.width,
                    y: Math.random() * simCanvas.height,
                    size: Math.random() * 2 + 1,
                    vx: Math.random() * 0.4 - 0.2,
                    vy: -(Math.random() * 0.6 + 0.2),
                    opacity: Math.random() * 0.6 + 0.1
                });
            }

            // Grass silhouettes
            for (let i = 0; i < 15; i++) {
                simWeeds.push({
                    x: Math.random() * simCanvas.width,
                    height: Math.random() * 120 + 80,
                    angleOffset: Math.random() * Math.PI,
                    speed: Math.random() * 0.02 + 0.01,
                    swayRange: Math.random() * 15 + 8,
                    color: `rgba(90, 115, 95, ${Math.random() * 0.2 + 0.1})`,
                    thickness: Math.random() * 3 + 2
                });
            }

            requestAnimationFrame(animateSimulator);
        }

        function resizeCanvas() {
            if (simCanvas) {
                const rect = simCanvas.parentElement.getBoundingClientRect();
                simCanvas.width = rect.width;
                simCanvas.height = rect.height;
            }
        }

        function animateSimulator(time) {
            if (!simCanvas) return;
            simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
            
            if (document.getElementById('camera-video').classList.contains('hidden')) {
                const grad = simCtx.createLinearGradient(0, 0, 0, simCanvas.height);
                grad.addColorStop(0, '#101311');
                grad.addColorStop(1, '#1b231d');
                simCtx.fillStyle = grad;
                simCtx.fillRect(0, 0, simCanvas.width, simCanvas.height);
            }

            simWeeds.forEach(w => {
                const sway = Math.sin(time * w.speed + w.angleOffset) * w.swayRange;
                simCtx.beginPath();
                simCtx.moveTo(w.x, simCanvas.height);
                simCtx.quadraticCurveTo(
                    w.x - sway * 0.5, simCanvas.height - w.height * 0.5,
                    w.x + sway, simCanvas.height - w.height
                );
                simCtx.strokeStyle = w.color;
                simCtx.lineWidth = w.thickness;
                simCtx.lineCap = 'round';
                simCtx.stroke();
            });

            simCtx.fillStyle = 'rgba(165, 196, 168, 0.4)';
            simParticles.forEach(p => {
                p.x += p.vx + Math.sin(time * 0.002) * 0.1;
                p.y += p.vy;

                if (p.y < -10) {
                    p.y = simCanvas.height + 10;
                    p.x = Math.random() * simCanvas.width;
                }
                simCtx.beginPath();
                simCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                simCtx.fillStyle = `rgba(165, 196, 168, ${p.opacity * (1 + Math.sin(time * 0.005 + p.x) * 0.2)})`;
                simCtx.fill();
            });

            requestAnimationFrame(animateSimulator);
        }

        // 7. Gift Modal Handlers
        function openGiftModal() {
            initAudio();
            collapseDrawer();
            
            const today = new Date();
            const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
            document.getElementById('cardDateText').innerText = dateStr;

            const modal = document.getElementById('giftModal');
            modal.classList.add('visible');
            
            document.getElementById('giftStepForm').classList.remove('hidden');
            document.getElementById('giftStepCard').classList.add('hidden');
        }

        function closeGiftModal() {
            document.getElementById('giftModal').classList.remove('visible');
        }

        function generateGiftCard() {
            const recipient = document.getElementById('recipientName').value.trim() || 'あなたへ';
            const message = document.getElementById('giftMessage').value.trim() || '実用性はないけれど、日常の足元で見つけた、ただ愛おしい美しさを贈ります。';
            
            document.getElementById('cardRecipientText').innerText = `To: ${recipient}`;
            document.getElementById('cardMessageText').innerText = message;
            
            const listEl = document.getElementById('cardCompositionList');
            listEl.innerHTML = `
                シロツメクサ x ${state.counts.clover}<br>
                ナズナ x ${state.counts.nazuna}<br>
                タンポポ x ${state.counts.tanpopo}<br>
                エノコログサ x ${state.counts.enokorogusa}
            `;

            const cardWeeds = document.getElementById('cardWeedsArea');
            cardWeeds.innerHTML = '';
            
            const sourceWeeds = document.querySelectorAll('#bouquetWeedsArea .weed-svg-item');
            sourceWeeds.forEach(item => {
                const clone = item.cloneNode(true);
                const currentSc = item.style.getPropertyValue('--sc') || '0.7';
                clone.style.setProperty('--sc', (parseFloat(currentSc) * 0.75).toFixed(2));
                cardWeeds.appendChild(clone);
            });

            document.getElementById('giftStepForm').classList.add('hidden');
            document.getElementById('giftStepCard').classList.remove('hidden');
            
            playChimeSound();
        }

        function backToForm() {
            document.getElementById('giftStepForm').classList.remove('hidden');
            document.getElementById('giftStepCard').classList.add('hidden');
        }

        function startOver() {
            closeGiftModal();
            resetBouquet();
        }

        // Export card to PNG using Canvas (Including dynamic SVG rendering)
        function downloadCardImage() {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 1000;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#FAF9F6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Double border
            ctx.strokeStyle = '#2F3E32';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
            
            ctx.strokeStyle = 'rgba(47, 62, 50, 0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

            // Header Logo
            ctx.fillStyle = '#68846C';
            ctx.font = "italic 400 16px 'Outfit', sans-serif";
            ctx.textAlign = 'center';
            ctx.letterSpacing = '0.4em';
            ctx.fillText("ZASSO HANATABA", canvas.width / 2, 85);
            ctx.letterSpacing = '0px';

            // Draw glass vase outline
            const vaseX = 180;
            const vaseY = 460;
            ctx.strokeStyle = '#2F3E32';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(vaseX - 50, vaseY, 100, 140, 20);
            ctx.stroke();
            
            // Highlight
            ctx.strokeStyle = 'rgba(47, 62, 50, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(vaseX - 35, vaseY + 15);
            ctx.lineTo(vaseX - 35, vaseY + 110);
            ctx.stroke();
            
            const weedSVGs = document.querySelectorAll('#bouquetWeedsArea .weed-svg-item');
            let loadedCount = 0;
            
            if (weedSVGs.length === 0) {
                drawCardTextAndDownload(canvas, ctx);
                return;
            }

            const drawings = Array.from(weedSVGs).map((el) => {
                const weedId = el.querySelector('svg').outerHTML.includes('clover') ? 'clover' :
                               el.querySelector('svg').outerHTML.includes('nazuna') ? 'nazuna' :
                               el.querySelector('svg').outerHTML.includes('tanpopo') ? 'tanpopo' : 'enokorogusa';
                
                const rotDeg = parseFloat(el.style.getPropertyValue('--rot') || '0');
                const scale = parseFloat(el.style.getPropertyValue('--sc') || '1');
                const txStyle = el.style.getPropertyValue('--tx') || '0';
                const tyStyle = el.style.getPropertyValue('--ty') || '0';
                
                let tx = 0, ty = 0;
                if (txStyle.includes('px')) tx = parseFloat(txStyle.split('calc(-50% + ')[1]) || 0;
                if (tyStyle.includes('px')) ty = parseFloat(tyStyle) || 0;
                
                const zIndex = parseInt(el.style.zIndex) || 0;
                
                return { weedId, rotDeg, scale, tx, ty, zIndex };
            });

            drawings.sort((a, b) => a.zIndex - b.zIndex);

            drawings.forEach((draw) => {
                const tplSvg = document.getElementById('tpl-' + draw.weedId);
                const svgString = new XMLSerializer().serializeToString(tplSvg);
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.onload = () => {
                    ctx.save();
                    ctx.translate(vaseX + draw.tx * 1.5, vaseY + 15 + draw.ty * 1.5);
                    ctx.rotate(draw.rotDeg * Math.PI / 180);
                    
                    const w = 150 * draw.scale * 1.2;
                    const h = 300 * draw.scale * 1.2;
                    ctx.drawImage(img, -w / 2, -h + 20, w, h);
                    
                    ctx.restore();
                    URL.revokeObjectURL(url);
                    
                    loadedCount++;
                    if (loadedCount === drawings.length) {
                        // Re-draw vase on top to overlap stems inside the glass
                        ctx.strokeStyle = '#2F3E32';
                        ctx.lineWidth = 4;
                        ctx.fillStyle = 'rgba(250,249,246,0.1)';
                        ctx.beginPath();
                        ctx.roundRect(vaseX - 50, vaseY, 100, 140, 20);
                        ctx.fill();
                        ctx.stroke();

                        drawCardTextAndDownload(canvas, ctx);
                    }
                };
                img.src = url;
            });
        }

        function drawCardTextAndDownload(canvas, ctx) {
            const recipient = document.getElementById('recipientName').value.trim() || 'あなたへ';
            const message = document.getElementById('giftMessage').value.trim() || '実用性はないけれど、日常の足元で見つけた、ただ愛おしい美しさを贈ります。';
            const today = new Date();
            const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

            const contentX = 390;
            ctx.fillStyle = '#1A281E';
            ctx.textAlign = 'left';

            // Recipient
            ctx.font = "bold 26px 'Shippori Mincho', serif";
            ctx.fillText(`To: ${recipient}`, contentX, 230);
            
            ctx.strokeStyle = 'rgba(104, 132, 108, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(contentX, 248);
            ctx.lineTo(canvas.width - 80, 248);
            ctx.stroke();

            // Message
            ctx.fillStyle = '#3B4E40';
            ctx.font = "italic 400 18px 'Shippori Mincho', serif";
            const maxTextWidth = canvas.width - contentX - 80;
            wrapText(ctx, message, contentX, 290, 36, maxTextWidth);

            // Divider
            ctx.strokeStyle = 'rgba(104, 132, 108, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(contentX, 580);
            ctx.lineTo(canvas.width - 80, 580);
            ctx.stroke();
            ctx.setLineDash([]);

            // Botanical stats
            ctx.fillStyle = '#68846C';
            ctx.font = "500 13px 'Outfit', sans-serif";
            ctx.fillText("BOTANICAL COMPOSITION", contentX, 615);

            ctx.fillStyle = '#2F3E32';
            ctx.font = "400 16px 'Shippori Mincho', serif";
            ctx.fillText(`・シロツメクサ (Focal)  ×  ${state.counts.clover}`, contentX, 650);
            ctx.fillText(`・ナズナ (Filler)  ×  ${state.counts.nazuna}`, contentX, 685);
            ctx.fillText(`・タンポポ (Accent)  ×  ${state.counts.tanpopo}`, contentX, 720);
            ctx.fillText(`・エノコログサ (Green)  ×  ${state.counts.enokorogusa}`, contentX, 755);

            // Footer info
            ctx.fillStyle = '#88928A';
            ctx.font = "300 14px 'Outfit', sans-serif";
            ctx.fillText(dateStr, contentX, 815);
            
            ctx.textAlign = 'right';
            ctx.fillText("Roadside bouquet project", canvas.width - 80, 815);

            // Download
            const link = document.createElement('a');
            link.download = `zasso_bouquet_${dateStr.replace(/\./g, '')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }

        function wrapText(context, text, x, y, lineHeight, maxWidth) {
            const words = text.split('');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n];
                let metrics = context.measureText(testLine);
                let testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n];
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        }
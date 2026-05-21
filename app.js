// Weeds Dictionary (Includes note-based detailed insights)
        const WEEDS = {};

        // State Management
        let state = {
            counts: {},
            total: 0,
            activeBadges: [],
            cameraStream: null,
            currentFacingMode: 'environment',
            videoDevices: [],
            isDrawerExpanded: false,
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
        });


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
                            // Extract common name or fallback to scientific name
                            let commonName = scientificName;
                            const isJapanese = (str) => /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(str);
                            
                            if (topResult.species.commonNames && topResult.species.commonNames.length > 0) {
                                // Prefer Japanese name if available
                                const jpName = topResult.species.commonNames.find(n => isJapanese(n));
                                commonName = jpName || topResult.species.commonNames[0];
                            }
                            
                            // If no Japanese name was found, try translating via Wikipedia API
                            if (!isJapanese(commonName)) {
                                try {
                                    const scientificQuery = topResult.species.scientificNameWithoutAuthor;
                                    const wikiUrl = `https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(scientificQuery)}&utf8=&format=json&origin=*`;
                                    const wikiRes = await fetch(wikiUrl);
                                    if (wikiRes.ok) {
                                        const wikiData = await wikiRes.json();
                                        if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
                                            const firstHit = wikiData.query.search[0].title;
                                            if (isJapanese(firstHit)) {
                                                commonName = firstHit; // Translated! (e.g. "カタクリ")
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.log("Wiki translation failed:", e);
                                }
                            }
                            
                            // Create a dynamic ID from the scientific name
                            detectedId = scientificName.replace(/[^a-z0-9]/g, '_');
                            
                            // Add to WEEDS if it doesn't exist
                            if (!WEEDS[detectedId]) {
                                // Generate a random pastel color based on the ID string
                                let hash = 0;
                                for (let i = 0; i < detectedId.length; i++) hash = detectedId.charCodeAt(i) + ((hash << 5) - hash);
                                const h = Math.abs(hash) % 360;
                                const color = `hsl(${h}, 40%, 75%)`;
                                
                                WEEDS[detectedId] = {
                                    id: detectedId,
                                    name: commonName,
                                    scientific: topResult.species.scientificNameWithoutAuthor,
                                    role: '',
                                    desc: '',
                                    points: Math.floor(score * 20) + 5,
                                    color: color,
                                    badgeText: '✨ これ積んで！',
                                    caution: 'トゲやかぶれる樹液に注意して優しく扱いましょう。',
                                    mizuage: '一般的な野草と同じように、茎を斜めに切って生けてみてください。',
                                    manner: '貴重な植物の可能性もあります。根こそぎ取らず、必要な分だけいただきましょう。'
                                };
                            }
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
                scanStatus.innerText = "エラー: " + err.message.substring(0, 20);
                alert("APIエラー詳細: " + err.message);
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

        // Helper to get SVG node for both hardcoded and dynamic weeds
        function getWeedSVGNode(weedId) {
            const tpl = document.getElementById('tpl-' + weedId);
            if (tpl) {
                const clone = tpl.cloneNode(true);
                clone.removeAttribute('id');
                return clone;
            }
            
            // Generate dynamic SVG
            const weedInfo = WEEDS[weedId] || { color: '#ffffff' };
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
            <svg viewBox="0 0 100 200" style="width: 100%; height: 100%; overflow: visible;" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 200 Q${40 + Math.random()*20} 120 50 40" stroke="rgba(255,255,255,0.4)" stroke-width="3" fill="none"/>
                <path d="M48 140 Q30 130 35 110 Q45 125 48 140" fill="${weedInfo.color}" opacity="0.8"/>
                <path d="M52 120 Q70 110 65 90 Q55 105 52 120" fill="${weedInfo.color}" opacity="0.8"/>
                <circle cx="50" cy="40" r="18" fill="${weedInfo.color}" opacity="0.9"/>
                <circle cx="50" cy="40" r="12" fill="rgba(255,255,255,0.5)"/>
                <circle cx="50" cy="40" r="6" fill="#FAF9F6"/>
            </svg>`;
            return tempDiv.firstElementChild;
        }

        // --- AR / Badge Spawning ---
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

            const svgTemplate = getWeedSVGNode(weedId);

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
            if (weedKeys.length === 0) return; // Wait until camera scans something

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
            
            const roleTag = document.getElementById('guideRoleTag');
            if (data.role) {
                roleTag.innerText = data.role;
                roleTag.style.display = 'inline-block';
            } else {
                roleTag.style.display = 'none';
            }
            document.getElementById('guideMainDesc').innerText = data.desc;
            
            // Juneray's safety rules & tips
            document.getElementById('guideCautionText').innerText = data.caution;
            document.getElementById('guideMizuageText').innerText = data.mizuage;
            document.getElementById('guideMannerText').innerText = data.manner;

            // Set botanical illustration inside modal
            const iconContainer = document.getElementById('guideDetailIcon');
            iconContainer.innerHTML = '';
            const svgClone = getWeedSVGNode(weedId);
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
                state.counts[weedId] = (state.counts[weedId] || 0) + 1;
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
            
            const svgTemplate = getWeedSVGNode(weedId);
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
            
            const weedSvg = getWeedSVGNode(weedId);
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
            Object.keys(WEEDS).forEach(k => { state.counts[k] = 0; });
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

        function checkAchievement() {
            const aiText = document.getElementById('aiAdviceText');
            const uniqueTypes = Object.keys(state.counts).filter(k => state.counts[k] > 0).length;
            
            if (state.total === 0) {
                aiText.innerText = "まだ花束は空っぽです。足元の小さな美しさを探してみましょう。まずはシロツメクサやタンポポなど、主役になる花を摘んでみてください。";
            } else if (state.total > 0 && state.total < 5) {
                aiText.innerText = "素敵なスタートですね！花束にボリュームを出すために、ナズナやエノコログサなどのグリーン（葉っぱ類）を探してみてください。";
            } else if (uniqueTypes >= 4) {
                aiText.innerText = "素晴らしい！いろんな種類の野草が揃い、バランスの取れた美しい花束になりました。さらに好きな種類を足して、あなたらしさを表現してみましょう。";
            } else if (state.total >= 5 && state.total < 10) {
                aiText.innerText = "花束らしくなってきました！さらに違う種類の草花を足すと、より華やかな印象になりますよ。";
            } else {
                aiText.innerText = "立派な野草の花束が完成しつつありますね！このまま集めるのも良し、メッセージを添えて誰かに贈るのも素敵です。";
            }
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

            const statsContainer = document.getElementById('stats-container');

            Object.keys(WEEDS).forEach(key => {
                const count = state.counts[key] || 0;
                let itemEl = document.getElementById('item-' + key);
                
                if (count > 0) {
                    if (!itemEl && statsContainer) {
                        const weed = WEEDS[key];
                        const itemHTML = `
                        <div class="stat-item hidden" id="item-${key}" onclick="promptCount('${key}')">
                            <div class="stat-icon" style="background-color: ${weed.color}22;">
                                ${weed.svgIcon || `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="15" fill="${weed.color}"/></svg>`}
                            </div>
                            <div class="stat-details">
                                <div class="stat-header">
                                    <span class="stat-name">${weed.name}<span class="stat-role">${weed.role || ''}</span></span>
                                    <span class="stat-count" id="count-${key}">0</span>
                                </div>
                                <div class="stat-bar-bg">
                                    <div class="stat-bar-fill" id="bar-${key}" style="background-color: ${weed.color}; width: 0%;"></div>
                                </div>
                            </div>
                        </div>`;
                        statsContainer.insertAdjacentHTML('beforeend', itemHTML);
                        itemEl = document.getElementById('item-' + key);
                        // Trigger reflow to ensure CSS transition works for the new element
                        void itemEl.offsetWidth;
                    }
                    
                    itemEl.classList.remove('hidden');
                    const countEl = document.getElementById('count-' + key);
                    const barEl = document.getElementById('bar-' + key);
                    
                    if (parseInt(countEl.innerText) !== count) {
                        countEl.innerText = count;
                        countEl.classList.add('bump');
                        setTimeout(() => countEl.classList.remove('bump'), 200);
                    }
                    
                    const pct = Math.min((count / 10) * 100, 100);
                    barEl.style.width = pct + '%';
                } else if (itemEl) {
                    itemEl.classList.add('hidden');
                }
            });

            checkAchievement();
        }

        // Emotional dynamic AI Advice
        function updateAIAdvice() {
            checkAchievement();
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
            
            const compositionList = document.getElementById('giftCompositionList');
            let compHTML = '';
            Object.keys(state.counts).forEach(key => {
                if (state.counts[key] > 0) {
                    const weed = WEEDS[key];
                    compHTML += `${weed.name} x ${state.counts[key]}<br>`;
                }
            });
            compositionList.innerHTML = compHTML;

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
            let compHTML = '';
            Object.keys(state.counts).forEach(key => {
                if (state.counts[key] > 0) {
                    const weed = WEEDS[key];
                    compHTML += `${weed.name} x ${state.counts[key]}<br>`;
                }
            });
            listEl.innerHTML = compHTML;

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
            document.getElementById('giftStepCard').classList.add('hidden');
            
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
                const tplSvg = getWeedSVGNode(draw.weedId);
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
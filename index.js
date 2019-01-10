import anime from 'animejs';

const AKANE = encodeURIComponent('茜ちゃんかわいい！！！！！');
const TOKEN = encodeURIComponent(btoa(Math.random)).slice(24);
const API_URL = 'https://script.google.com/macros/s/AKfycbyIPZAgTuRN0_Plvky4Cy4_wua6GeWh2UNritshBEFdjh6ihsvT/exec';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const gravityA = 2 + Math.sqrt(3);
const gravityB = - 1 - Math.sqrt(3);
anime.easings['gravity'] = (t) => {
    return gravityA * t * t + gravityB * t;
}

async function fetchSounds() {
    const sounds = [
        'sound/nyaaaa.mp3',
        'sound/nyasc.mp3',
        'sound/nyaweak.mp3',
        'sound/unya-long.mp3',
        'sound/unya-short.mp3',
    ];
    const responses = await Promise.all(sounds.map((p) => fetch(p)));
    const buffers = await Promise.all(responses.map((r) => r.arrayBuffer()));
    return Promise.all(buffers.map((buf) => {
        return new Promise((resolve, reject) => audioContext.decodeAudioData(buf, resolve));
    }));
}

function random(n) {
    return Math.floor(Math.random()*n)
}

function scoreFunction(time) {
    const x = 3-time/1000*2/7;
    return 100000/(1+Math.exp(-x));
}

function sendScore(score) {
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: `token=${TOKEN}&akane=${AKANE}&score=${score}`,
    })
    .catch(console.log);
}


document.addEventListener('DOMContentLoaded', async () => {
    const giant = document.getElementById('giant-akane');
    const body = document.getElementsByTagName('body')[0];
    const globalScore = document.getElementById('global-score');
    const localScore = document.getElementById('local-score');
    const counter = document.getElementById('counter');
    const twitterButton = document.getElementById('twitter-button');
    const GONE_DURATION = 500;
    const BONNO = 108;

    const swingAnime = anime({
        targets: giant,
        rotate: '-10deg',
        direction: 'alternate',
        duration: 100,
        easing: 'easeOutCubic',
    });
    swingAnime.pause();

    let count = 0;
    let startTime = null;

    const sounds = await fetchSounds();

    const siteUrl = encodeURIComponent('https://nkudryavka.github.io/akanechan-gone-challenge/');
    const hashtags = `Akanechan_Gone_Challenge,${encodeURIComponent('茜ちゃん絶対に主人公にするからね')},${encodeURIComponent('茜ちゃん絶対に島流しにするからね')}`;
    function getTweetUrl(score) {
        const content = encodeURIComponent(`Akanechan Gone Challengeで煩悩を${score.toLocaleString()}km吹っ飛ばした！\n1/12 22:22 #茜ちゃん絶対に主人公にするからね （一斉投票）も忘れずに！`);
        return `https://twitter.com/intent/tweet?text=${content}&url=${siteUrl}&hashtags=${hashtags}`;
    }

    // Get global score
    fetch(`${API_URL}?akane=${AKANE}`)
    .then((res) => res.json())
    .then((res) => {
        globalScore.textContent = res.score.toLocaleString();
    });

    function nya() {
        audioContext.resume();
        const source = audioContext.createBufferSource();
        source.buffer = sounds[random(sounds.length)];
        source.connect(audioContext.destination);
        source.start(0);
        giant.style.transformOrigin = 'center';
        count++;
        if (count < BONNO) {
            counter.textContent = count;
            if (count === 1) {
                startTime = Date.now();
            }
            swingAnime.restart();
        } else if (count === BONNO) {
            const score = scoreFunction(Date.now() - startTime);
            counter.textContent = count;
            twitterButton.href = getTweetUrl(score);
            anime({
                targets: giant,
                translateX: {
                    value: body.clientWidth,
                    easing: 'linear',
                },
                translateY: {
                    value: -body.clientHeight/2,
                    easing: 'easeOutQuad',
                },
                rotate: {
                    value: '10turn',
                    easing: 'linear',
                },
                duration: GONE_DURATION,
            });
            const tempObj = {sc: 0};
            anime({
                targets: tempObj,
                sc: score,
                easing: 'easeOutCubic',
                duration: GONE_DURATION,
                update: () => {localScore.textContent = tempObj.sc.toLocaleString()},
            });
            sendScore(score);
        }
    }
    
    giant.addEventListener('touchstart', (e) => {
        e.preventDefault();
        nya();
    });
    giant.addEventListener('mousedown', (e) => {
        e.preventDefault();
        nya();
    });
});
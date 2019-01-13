import anime from 'animejs';

const AKANE = encodeURIComponent('茜ちゃんかわいい！！！！！');
const TOKEN = encodeURIComponent(btoa(Math.random)).slice(24);
const API_URL = 'https://script.google.com/macros/s/AKfycbx_eFCzXjwH967PiCRG0qDoEB7wBX8RKo5POprzJSzAZ80uwIB_/exec';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
function playSound(sound, volume) {
    const source = audioContext.createBufferSource();
    source.buffer = sound;
    if (volume) {
        const gain = audioContext.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(audioContext.destination);
    } else {
        source.connect(audioContext.destination);
    }
    source.start(0);
}

async function fetchSounds() {
    const sounds = [
        'sound/gun.mp3',
        'sound/fall.mp3',
        'sound/nyaaaa.mp3',
        'sound/nyasc.mp3',
        'sound/unya-long.mp3',
        'sound/zaboon.mp3',
    ];
    const responses = await Promise.all(sounds.map((p) => fetch(p)));
    const buffers = await Promise.all(responses.map((r) => r.arrayBuffer()));
    return Promise.all(buffers.map((buf) => {
        return new Promise((resolve, reject) => audioContext.decodeAudioData(buf, resolve));
    })).then(res => {
        return {
            gun: res[0],
            fall: res[1],
            akaneLong: res[2],
            akaneShort: res[3],
            akaneUnya: res[4],
            zaboon: res[5],
        };
    });
}

function random(n) {
    return Math.floor(Math.random()*n)
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
    const body = document.getElementsByTagName('body')[0];
    const flyingTicket = document.getElementById('flying-ticket');
    const game = document.getElementById('game');
    const startButton = document.getElementById('start-button');
    const shipWrapper = document.getElementById('ship-wrapper');
    const globalScore = document.getElementById('global-score');
    const localScore = document.getElementById('local-score');
    const finishOverlay = document.getElementById('finish-overlay');
    const twitterButton = document.getElementById('twitter-button');
    const gameWidth = game.clientWidth;
    const shipRange = [0.208, 0.774];
    let gameScore = 0;
    let lastClickTime = Date.now();
    const CLICK_SPAN = 500;
    const SPAWN_INTERVAL = 500;
    const SHIP_SINK = gameWidth/9;
    const isValidClick = () => Date.now() - lastClickTime > CLICK_SPAN
    const sounds = await fetchSounds();

    let shipAnimation = null;

    document.getElementById('reload').addEventListener('click', location.reload);

    function onClickTicket(event, animations, score) {
        event.preventDefault();
        const ticketDrop = gameWidth/1.9;
        const shipOffset = parseFloat(shipAnimation.animations[0].currentValue);
        animations.forEach(a => a.pause());
        const ticketPosition = (event.currentTarget.offsetLeft+event.currentTarget.offsetWidth/2)/gameWidth;
        console.log(ticketPosition);
        const isOnShip = shipRange[0] < ticketPosition && ticketPosition < shipRange[1];
        if (isOnShip) gameScore += score;
        const target = event.currentTarget;
        const tl = anime.timeline({
            targets: target,
        });
        tl.add({
            top: {
                value: ticketDrop + shipOffset,
                easing: 'easeInQuad',
            },
            rotateX: {
                value: `${random(5)}turn`,
                easing: 'linear',
            },
            rotateY: {
                value: `${random(5)}turn`,
                easing: 'linear',
            },
            rotateZ: {
                value: `${Math.random()/10 + (Math.random() < 0.5 ? 0.45 : -0.05)}turn`,
                easing: 'linear',
            },
            duration: 500,
            complete: () => {
                if (isOnShip) {
                    playSound(sounds.fall, score/500000);
                } else {
                    playSound(sounds.zaboon, score/1000000);
                }
            },
        });
        if (isOnShip) {
            tl.add({
                top: [ticketDrop + shipOffset, ticketDrop + SHIP_SINK],
                duration: shipAnimation.duration - shipAnimation.currentTime - 500,
                easing: 'linear',
            });
        } else {
            tl.add({
                top: [ticketDrop + shipOffset, ticketDrop + SHIP_SINK*2],
                opacity: 0,
                duration: 1000,
                easing: 'linear',
                complete: () => target.remove(),
            });
        }
    }
    function spawnTicket() {
        const ft = flyingTicket.cloneNode(true);
        const durationX = Math.random() * 2000 + 2000;
        const durationY = 500 * Math.random() + 300;
        const diffY = Math.random()/5;
        const posY = Math.random()/5;
        const score = Math.floor((5/(durationX-1000) + 20/durationY*diffY)*20000000);
        ft.removeAttribute('id');
        ft.style.display = 'block';
        ft.style.left = `${-gameWidth/4}px`;
        let animations = [];
        // wings
        animations.push(anime({
            targets: ft.getElementsByClassName('left-wing'),
            rotate: {
                value: '-60deg',
                duration: 300,
                easing: 'easeInOutQuad',
            },
            direction: 'alternate',
            loop: true,
        }));
        animations.push(anime({
            targets: ft.getElementsByClassName('right-wing'),
            rotate: {
                value: '60deg',
                duration: 300,
                easing: 'easeInOutQuad',
            },
            direction: 'alternate',
            loop: true,
        }));
        const xMoveArray = [`${-gameWidth/4}px`, `${gameWidth*5/4}px`];
        // X move
        animations.push(anime({
            targets: ft,
            left: Math.random() < 0.5 ? xMoveArray : xMoveArray.reverse(),
            easing: 'linear',
            duration: durationX,
            complete: () => ft.remove(),
        }));
        // Y move
        animations.push(anime({
            targets: ft,
            top: [`${gameWidth*posY}px`, `${gameWidth*(posY+diffY)}px`],
            easing: 'easeInOutSine',
            duration: durationY,
            direction: 'alternate',
            loop: true,
        }));
        const listener = e => isValidClick() ? onClickTicket(e, animations, score) : null;
        ft.addEventListener('touchstart', listener, {once: true});
        ft.addEventListener('mousedown', listener, {once: true});
        game.appendChild(ft);
    }
    
    const siteUrl = encodeURIComponent('https://nkudryavka.github.io/akanechan-ship-sink/');
    const hashtags = `Akanechan_Ship_Sink`;
    function getTweetUrl(score) {
        const content = encodeURIComponent(`Akanechan Ship Sinkで茜ちゃんに${score.toLocaleString()}票あげたよ！${score >= 1000000 ? 'Million Vote!!達成！' : ''}Good luck茜ちゃん！`);
        return `https://twitter.com/intent/tweet?text=${content}&url=${siteUrl}&hashtags=${hashtags}`;
    }

    function onClickGame(e) {
        e.preventDefault();
        if (!isValidClick()) return;
        lastClickTime = Date.now();
        playSound(sounds.gun, 0.2);
    }

    // Get global score
    fetch(`${API_URL}?akane=${AKANE}`)
    .then((res) => res.json())
    .then((res) => {
        globalScore.textContent = res.score.toLocaleString();
    });

    let spawnIntervalId;
    function onFinish() {
        playSound(sounds.akaneLong);
        clearInterval(spawnIntervalId);
        sendScore(gameScore);
        game.removeEventListener('touchstart', onClickGame);
        game.removeEventListener('mousedown', onClickGame);
        twitterButton.href = getTweetUrl(gameScore);
        finishOverlay.style.display = 'table';
        let tempObj = {score: 0};
        anime({
            targets: tempObj,
            score: gameScore,
            duration: 1000,
            easing: 'linear',
            round: 1,
            update: () => localScore.textContent = tempObj.score.toLocaleString(),
            complete: () => {
                if (gameScore >= 1000000) {
                    document.getElementById('million-vote').style.display = 'inline';
                    playSound(sounds.akaneUnya);
                }
            }
        });
    }
    
    startButton.addEventListener('click', event => {
        event.preventDefault();
        audioContext.resume();
        playSound(sounds.akaneShort);
        startButton.style.display = 'none';
        spawnIntervalId = setInterval(spawnTicket, SPAWN_INTERVAL);
        game.addEventListener('touchstart', onClickGame);
        game.addEventListener('mousedown', onClickGame);
        anime({
            targets: shipWrapper,
            duration: 10000,
            easing: 'linear',
            top: SHIP_SINK,
            update: anim => shipAnimation = anim,
            complete: onFinish
        });
    }, {once: true});
});
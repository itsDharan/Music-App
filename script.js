let currentSong = new Audio();

let songs;

let currFolder;

function convertSecondsToMinutes(seconds) {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
}



async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let text = await response.text();

        let div = document.createElement("div");
        div.innerHTML = text;
        let links = div.getElementsByTagName("a");

        songs = [];
        for (let i = 0; i < links.length; i++) {
            const element = links[i];
            if (element.href.endsWith(".mp3")) {
                const songPath = element.href.split(`/${folder}/`)[1];
                if (songPath) {
                    songs.push(decodeURIComponent(songPath));
                } else {
                    console.error(`Invalid song URL: ${element.href}`);
                }
            }
        }
        if (songs.length === 0) {
            throw new Error("No songs found");
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

const playMusic = (track, pause = false) => {
    if (!track) {
        console.error("No track to play");
        return;
    }
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = track.replace(".mp3", "").replace(/%20/g, " ");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function loadPlaylist(folder) {
    await getSongs(folder);
    if (songs && songs.length > 0) {
        playMusic(songs[0], true);
        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = ""; // Clear existing list
        for (const song of songs) {
            songUL.innerHTML += `<li>
                <img class="invert" style="width: 20px;" src="music.svg" alt="">
                <div class="info">
                    <div class="songname">${song.replace(".mp3", "").replace(/%20/g, " ")}</div>
                    <div class="artist">${folder.replace("songs/"," ")}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img style="width: 20px; height: 20px;" src="play.svg" alt="">
                </div>
            </li>`;
        }

        Array.from(document.querySelector(".songlist ul").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                let songName = e.querySelector(".info .songname").innerText.trim();
                let track = songs.find(s => s.replace(".mp3", "") === songName);
                if (track) {
                    playMusic(track);
                } else {
                    console.error("Track not found:", songName);
                }
            });
        });
    } else {
        console.error("No songs available to play");
    }
}
async function main() {
    // Initially load the default playlist
    await loadPlaylist("Songs/");

    // Add an event to play button
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "play.svg";
        }
    });

    // Listen to song time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${convertSecondsToMinutes(currentSong.currentTime)} / ${convertSecondsToMinutes(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event to seek bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Add event to hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    // Add event on previous button
    document.getElementById("previous").addEventListener("click", () => {
        let currentIndex = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
        if (currentIndex > 0) {
            playMusic(songs[currentIndex - 1]);
        } else {
            playMusic(songs[songs.length - 1]); // Play the last song if the first song is playing
        }
    });

    // Add event on next button
    document.getElementById("next").addEventListener("click", () => {
        let currentIndex = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
        if (currentIndex < songs.length - 1) {
            playMusic(songs[currentIndex + 1]);
        } else {
            playMusic(songs[0]); // Play the first song if the last song is playing
        }
    });

    // Add event on volume button
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            const folder = item.currentTarget.dataset.folder;
            await loadPlaylist(`songs/${folder}`);
        });
    });
    // ADD event to mute
    document.querySelector(".volume>img").addEventListener("click",e=>{
        if(e.target.src.includes("volume.svg")){
            e.target.src= e.target.src.replace("volume.svg","mute.svg")
            currentSong.volume=0;
            document.querySelector(".range").getElementsByTagName("input")[0].value=0;

        }
        else{
            e.target.src=e.target.src.replace("mute.svg","volume.svg")
            currentSong.volume=.50;
            document.querySelector(".range").getElementsByTagName("input")[0].value=100;

        }
    })
}

main();
// sound.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

// define the .sound module and immediately invoke it in an IIFE
app.sound = (function(){

	var bgAudio = undefined;
    
    function init() {
        bgAudio = document.querySelector("#bgAudio");
        bgAudio.volume = 0.3;
    }
    
    function playBGAudio() {
        bgAudio.play();
    }
    
    function stopBGAudio() {
        bgAudio.pause();
        bgAudio.currentTime = 0;
    }
    
    function playSound(snd) {
        var sound = document.createElement('audio');
        sound.volume = 0.3;
        sound.src = 'media/' + snd;
        sound.play();
    }
    
    return{
        init: init,
        stopBGAudio: stopBGAudio,
        playBGAudio: playBGAudio,
        playSound: playSound
    };
		
	// export a public interface to this module
	// TODO
}());
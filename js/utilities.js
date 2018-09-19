"use strict";

function getMouse(e) {
    app.main.mousex = e.pageX - e.target.offsetLeft;
	app.main.mousey = e.pageY - e.target.offsetTop;
}

function Magnitude(xComponent, yComponent) {
    return Math.sqrt((xComponent * xComponent) + (yComponent * yComponent));
}

/*function findVector(vec1, vec2) {
    var newX = vec1.x - vec2.x;
    var newY = vec1.y - vec2.y;
    return [newX, newY];
}*/

function findVector(vec1x, vec1y, vec2x, vec2y) {
    var newX = vec1x - vec2x;
    var newY = vec1y - vec2y;
    return [newX, newY];
}

function Normalize(vector) {
    var xComponent = vector[0];
    var yComponent = vector[1];
    
    var magnitude = Magnitude(xComponent, yComponent);
    
    xComponent /= magnitude;
    yComponent /= magnitude;
    
    return [xComponent, yComponent];
}

function Random(startValue, range) {
    var randomNum = Math.random() * range;
    randomNum -= startValue;
    
    return randomNum;
}

function DrawText(ctx, text, x, y, font, color) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}
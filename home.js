

var cronologia = document.getElementById('cronologia-container');
var temperatureButton = document.getElementById('temperature');

temperatureButton.addEventListener('click', () => {
    cronologia.hidden = "false";
    document.getElementById('button-container').hidden = "true";
});
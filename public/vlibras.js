const translator = document.createElement('div');
translator.setAttribute('vw', '');
translator.className = 'enabled';
translator.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
document.body.append(translator);

const widget = document.createElement('script');
widget.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
widget.onload = () => new window.VLibras.Widget('https://vlibras.gov.br/app');
document.body.append(widget);
